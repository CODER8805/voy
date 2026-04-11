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