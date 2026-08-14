document.addEventListener('DOMContentLoaded', () => {
    const materialsList = document.getElementById('materials-list');
    const addMaterialBtn = document.getElementById('add-material-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const clearBtn = document.getElementById('clear-btn');
    const shareBtn = document.getElementById('share-whatsapp-btn');
    const resultSection = document.getElementById('result-section');
    const saveStatus = document.getElementById('save-status');

    // Labor inputs
    const desiredSalaryInput = document.getElementById('desired-salary');
    const daysPerWeekInput = document.getElementById('days-per-week');
    const hoursPerDayInput = document.getElementById('hours-per-day');
    const calculatedHourlyRate = document.getElementById('calculated-hourly-rate');

    let hourlyRateValue = 0;

    // Initialize
    loadData();
    calculateHourlyRate();
    updatePartialMaterialsCost();

    // Event Listeners
    addMaterialBtn.addEventListener('click', () => {
        addMaterialRow();
        saveData();
    });
    calculateBtn.addEventListener('click', calculatePrice);
    clearBtn.addEventListener('click', clearAll);
    shareBtn.addEventListener('click', shareWhatsApp);

    // Auto calculate hourly rate when inputs change
    [desiredSalaryInput, daysPerWeekInput, hoursPerDayInput].forEach(input => {
        input.addEventListener('input', () => {
            calculateHourlyRate();
            saveData();
        });
    });

    // Auto-save for other simple inputs
    const simpleInputs = ['product-name', 'time-spent', 'other-costs', 'profit-margin'];
    simpleInputs.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.addEventListener('input', saveData);
        }
    });

    materialsList.addEventListener('input', () => {
        updatePartialMaterialsCost();
        saveData();
    });

    function calculateHourlyRate() {
        const salary = parseFloat(desiredSalaryInput.value) || 0;
        const days = parseFloat(daysPerWeekInput.value) || 0;
        const hours = parseFloat(hoursPerDayInput.value) || 0;

        if (salary > 0 && days > 0 && hours > 0) {
            // Assume 4.33 weeks per month on average
            const weeksPerMonth = 4.33;
            const totalHoursPerMonth = days * hours * weeksPerMonth;
            hourlyRateValue = salary / totalHoursPerMonth;
            calculatedHourlyRate.textContent = formatCurrency(hourlyRateValue);
        } else {
            hourlyRateValue = 0;
            calculatedHourlyRate.textContent = 'R$ 0,00';
        }
    }

    function addMaterialRow(data = {}) {
        const row = document.createElement('div');
        row.className = 'material-row';
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Insumo (Ex: Farinha)';
        nameInput.className = 'mat-name';
        nameInput.value = data.name || '';

        const priceInput = document.createElement('input');
        priceInput.type = 'number';
        priceInput.placeholder = 'R$ Pacote';
        priceInput.step = '0.01';
        priceInput.min = '0';
        priceInput.className = 'mat-price';
        priceInput.title = 'Preço pago na embalagem';
        priceInput.value = data.price || '';

        const pkgInput = document.createElement('input');
        pkgInput.type = 'number';
        pkgInput.placeholder = 'Qtd Emb. (g/ml)';
        pkgInput.min = '0';
        pkgInput.className = 'mat-pkg';
        pkgInput.title = 'Quantidade total da embalagem (Ex: 1000 para 1kg)';
        pkgInput.value = data.pkg || '';

        const usedInput = document.createElement('input');
        usedInput.type = 'number';
        usedInput.placeholder = 'Qtd Usada';
        usedInput.min = '0';
        usedInput.className = 'mat-used';
        usedInput.title = 'Quantidade que você usa na receita';
        usedInput.value = data.used || '';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn-remove';
        removeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
        removeBtn.title = 'Remover insumo';
        removeBtn.onclick = () => {
            row.remove();
            updatePartialMaterialsCost();
            saveData();
        };

        row.appendChild(nameInput);
        row.appendChild(priceInput);
        row.appendChild(pkgInput);
        row.appendChild(usedInput);
        row.appendChild(removeBtn);

        materialsList.appendChild(row);
    }

    function calculateMaterialsTotal() {
        let total = 0;
        const rows = document.querySelectorAll('.material-row');
        rows.forEach(row => {
            const price = parseFloat(row.querySelector('.mat-price').value) || 0;
            const pkg = parseFloat(row.querySelector('.mat-pkg').value) || 0;
            const used = parseFloat(row.querySelector('.mat-used').value) || 0;

            if (price > 0 && pkg > 0 && used > 0) {
                // Rule of 3: Cost = (Price / Pkg Qtd) * Used Qtd
                const proportionalCost = (price / pkg) * used;
                total += proportionalCost;
            }
        });
        return total;
    }

    function updatePartialMaterialsCost() {
        const total = calculateMaterialsTotal();
        document.getElementById('partial-materials-cost').textContent = formatCurrency(total);
    }

    function calculatePrice() {
        // 1. Calculate Materials Cost
        const totalMaterialsCost = calculateMaterialsTotal();
        updatePartialMaterialsCost();

        // 2. Calculate Labor Cost
        const timeSpent = parseFloat(document.getElementById('time-spent').value) || 0;
        const laborCost = hourlyRateValue * timeSpent;

        // 3. Other Costs
        const otherCosts = parseFloat(document.getElementById('other-costs').value) || 0;

        // 4. Total Cost (Minimum Price)
        const totalCost = totalMaterialsCost + laborCost + otherCosts;

        // 5. Margin and Suggested Price
        const margin = parseFloat(document.getElementById('profit-margin').value) || 0;
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
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Storage Functions
    function saveData() {
        const data = {
            productName: document.getElementById('product-name').value,
            desiredSalary: document.getElementById('desired-salary').value,
            daysPerWeek: document.getElementById('days-per-week').value,
            hoursPerDay: document.getElementById('hours-per-day').value,
            timeSpent: document.getElementById('time-spent').value,
            otherCosts: document.getElementById('other-costs').value,
            profitMargin: document.getElementById('profit-margin').value,
            materials: []
        };

        document.querySelectorAll('.material-row').forEach(row => {
            data.materials.push({
                name: row.querySelector('.mat-name').value,
                price: row.querySelector('.mat-price').value,
                pkg: row.querySelector('.mat-pkg').value,
                used: row.querySelector('.mat-used').value
            });
        });

        localStorage.setItem('calculacusto_mei_data', JSON.stringify(data));
        showSaveStatus();
    }

    function loadData() {
        const raw = localStorage.getItem('calculacusto_mei_data');
        if (raw) {
            try {
                const data = JSON.parse(raw);
                if (data.productName !== undefined) document.getElementById('product-name').value = data.productName;
                if (data.desiredSalary !== undefined) document.getElementById('desired-salary').value = data.desiredSalary;
                if (data.daysPerWeek !== undefined) document.getElementById('days-per-week').value = data.daysPerWeek;
                if (data.hoursPerDay !== undefined) document.getElementById('hours-per-day').value = data.hoursPerDay;
                if (data.timeSpent !== undefined) document.getElementById('time-spent').value = data.timeSpent;
                if (data.otherCosts !== undefined) document.getElementById('other-costs').value = data.otherCosts;
                if (data.profitMargin !== undefined) document.getElementById('profit-margin').value = data.profitMargin;

                if (data.materials && data.materials.length > 0) {
                    data.materials.forEach(mat => addMaterialRow(mat));
                } else {
                    addMaterialRow();
                }
            } catch (e) {
                console.error("Error loading data", e);
                addMaterialRow();
            }
        } else {
            addMaterialRow();
        }
    }

    function clearAll() {
        if(confirm('Tem certeza que deseja limpar todos os dados?')) {
            localStorage.removeItem('calculacusto_mei_data');
            location.reload();
        }
    }

    let saveTimeout;
    function showSaveStatus() {
        saveStatus.textContent = 'Salvo automaticamente';
        saveStatus.classList.add('show');
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveStatus.classList.remove('show');
        }, 2000);
    }

    function formatCurrency(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function shareWhatsApp() {
        const prodName = document.getElementById('product-name').value || 'Produto';
        const cost = document.getElementById('res-total-cost').textContent;
        const price = document.getElementById('res-suggested-price').textContent;
        const profit = document.getElementById('res-profit').textContent;

        const text = `📊 *Resumo de Precificação: ${prodName}*\n\n` +
                     `💰 *Custo de Produção:* ${cost}\n` +
                     `🏷️ *Preço de Venda Sugerido:* ${price}\n` +
                     `✨ *Lucro Estimado:* ${profit}\n\n` +
                     `_Calculado via CalculaCusto MEI_`;

        const encodedText = encodeURIComponent(text);
        window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
    }
});
