document.addEventListener('DOMContentLoaded', () => {
    const materialsList = document.getElementById('materials-list');
    const addMaterialBtn = document.getElementById('add-material-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultSection = document.getElementById('result-section');

    // Add initial material row
    addMaterialRow();

    addMaterialBtn.addEventListener('click', addMaterialRow);
    calculateBtn.addEventListener('click', calculatePrice);

    function addMaterialRow() {
        const row = document.createElement('div');
        row.className = 'material-row';
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Nome do insumo';
        nameInput.className = 'mat-name';

        const costInput = document.createElement('input');
        costInput.type = 'number';
        costInput.placeholder = 'Custo (R$)';
        costInput.step = '0.01';
        costInput.min = '0';
        costInput.className = 'mat-cost';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn-remove';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = 'Remover insumo';
        removeBtn.onclick = () => row.remove();

        row.appendChild(nameInput);
        row.appendChild(costInput);
        row.appendChild(removeBtn);

        materialsList.appendChild(row);
    }

    function calculatePrice() {
        // 1. Calculate Materials Cost
        let totalMaterialsCost = 0;
        const costInputs = document.querySelectorAll('.mat-cost');
        costInputs.forEach(input => {
            const val = parseFloat(input.value);
            if (!isNaN(val) && val > 0) {
                totalMaterialsCost += val;
            }
        });

        // 2. Calculate Labor Cost
        const hourlyRate = parseFloat(document.getElementById('hourly-rate').value) || 0;
        const timeSpent = parseFloat(document.getElementById('time-spent').value) || 0;
        const laborCost = hourlyRate * timeSpent;

        // 3. Other Costs
        const otherCosts = parseFloat(document.getElementById('other-costs').value) || 0;

        // 4. Total Cost (Minimum Price)
        const totalCost = totalMaterialsCost + laborCost + otherCosts;

        // 5. Margin and Suggested Price
        const margin = parseFloat(document.getElementById('profit-margin').value) || 0;
        // Markup formula: Price = Cost + (Cost * Margin / 100)
        const profit = totalCost * (margin / 100);
        const suggestedPrice = totalCost + profit;

        // Update UI
        document.getElementById('res-materials').textContent = formatCurrency(totalMaterialsCost);
        document.getElementById('res-labor').textContent = formatCurrency(laborCost);
        document.getElementById('res-other').textContent = formatCurrency(otherCosts);
        document.getElementById('res-total-cost').textContent = formatCurrency(totalCost);
        document.getElementById('res-suggested-price').textContent = formatCurrency(suggestedPrice);
        document.getElementById('res-profit').textContent = formatCurrency(profit);

        resultSection.classList.remove('hidden');
        
        // Scroll to results
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    function formatCurrency(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
});
