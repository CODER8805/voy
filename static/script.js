document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('authModal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeSpan = document.getElementsByClassName('close')[0];

    if (openModalBtn) {
        openModalBtn.onclick = function(e) {
            e.preventDefault();
            modal.style.display = 'flex';
        }
    }

    if (closeSpan) {
        closeSpan.onclick = function() {
            modal.style.display = 'none';
        }
    }

    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }

    let currentSelection = null;
    let basePrice = 0;
    let activeType = '';

    const items = document.querySelectorAll('.selectable-item');
    const panelDisplay = document.getElementById('cost-breakdown');
    const inputItemId = document.getElementById('form_item_id');
    const inputItemType = document.getElementById('form_item_type');
    const inputTotalPrice = document.getElementById('form_total_price');
    const btnProceed = document.getElementById('proceed-btn');
    const inputNights = document.getElementById('nights-input');

    function refreshBillingEngine() {
        if (!currentSelection) {
            panelDisplay.innerHTML = '<p>Select an item to view real-time pricing.</p>';
            if (btnProceed) btnProceed.disabled = true;
            return;
        }

        let calculatedTotal = basePrice;
        let breakdownHTML = `<p>Base Fare: $${basePrice.toFixed(2)}</p>`;

        if (activeType === 'hotel' && inputNights) {
            const duration = parseInt(inputNights.value) || 1;
            calculatedTotal = basePrice * duration;
            breakdownHTML = `<p>$${basePrice.toFixed(2)} x ${duration} night(s)</p>`;
        }

        const platformFee = calculatedTotal * 0.12;
        const finalGrandTotal = calculatedTotal + platformFee;

        panelDisplay.innerHTML = `
            ${breakdownHTML}
            <p>Taxes & Platform Fees (12%): $${platformFee.toFixed(2)}</p>
            <div style="height: 1px; background: rgba(0,255,204,0.3); margin: 15px 0;"></div>
            <h3>Estimated Total: $<span class="glow-text">${finalGrandTotal.toFixed(2)}</span></h3>
        `;

        if (inputItemId) inputItemId.value = currentSelection.dataset.id;
        if (inputItemType) inputItemType.value = activeType;
        if (inputTotalPrice) inputTotalPrice.value = finalGrandTotal.toFixed(2);
        if (btnProceed) btnProceed.disabled = false;
    }

    items.forEach(el => {
        el.addEventListener('click', function() {
            items.forEach(i => i.classList.remove('selected'));
            this.classList.add('selected');
            currentSelection = this;
            basePrice = parseFloat(this.dataset.price);
            activeType = this.dataset.type;
            refreshBillingEngine();
        });
    });

    if (inputNights) {
        inputNights.addEventListener('input', refreshBillingEngine);
    }

    const dropdownSort = document.getElementById('sort-select');
    const containerHotelGrid = document.getElementById('hotel-grid');

    if (dropdownSort && containerHotelGrid) {
        dropdownSort.addEventListener('change', function() {
            const order = this.value;
            if (order === 'none') return;
            
            const hotelElements = Array.from(containerHotelGrid.getElementsByClassName('hotel-item'));

            hotelElements.sort((a, b) => {
                const valA = parseFloat(a.dataset.price);
                const valB = parseFloat(b.dataset.price);
                if (order === 'asc') return valA - valB;
                return valB - valA;
            });

            containerHotelGrid.innerHTML = '';
            hotelElements.forEach(element => containerHotelGrid.appendChild(element));
        });
    }

    const flashMessages = document.querySelectorAll('.flash-message');
    flashMessages.forEach(msg => {
        msg.style.cursor = 'pointer';
        
        msg.addEventListener('click', () => {
            msg.classList.add('fade-out');
            setTimeout(() => msg.remove(), 500);
        });

        if (!msg.innerText.includes('CRITICAL')) {
            setTimeout(() => {
                if(document.body.contains(msg)) {
                    msg.classList.add('fade-out');
                    setTimeout(() => msg.remove(), 500);
                }
            }, 4000);
        }
    });

    // --- NEW: Automatically pop the modal open based on URL parameter ---
    const urlParams = new URLSearchParams(window.location.search);
    const modalToOpen = urlParams.get('modal');

    if (modalToOpen && modal) {
        modal.style.display = 'flex';
        if (window.switchTab) {
            window.switchTab(modalToOpen);
        }
        // Clean the URL bar so the modal doesn't pop open if they hit refresh manually
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

window.switchTab = function(tabName) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');
    const resetTab = document.getElementById('resetTab');

    tabBtns.forEach(btn => btn.classList.remove('active'));
    forms.forEach(form => form.classList.remove('active'));

    if (resetTab) resetTab.style.display = 'none';

    if (tabName === 'login') {
        tabBtns[0].classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else if (tabName === 'signup') {
        tabBtns[1].classList.add('active');
        document.getElementById('signupForm').classList.add('active');
    } else if (tabName === 'reset') {
        if (resetTab) {
            resetTab.style.display = 'block';
            resetTab.classList.add('active');
        }
        document.getElementById('resetForm').classList.add('active');
    }
};