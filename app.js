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

    // Unit options
    const unitOptions = [
        { value: 'g', label: 'Gramas (g)', multiplier: 1, type: 'mass' },
        { value: 'kg', label: 'Quilos (Kg)', multiplier: 1000, type: 'mass' },
        { value: 'ml', label: 'Mililitros (ml)', multiplier: 1, type: 'volume' },
        { value: 'l', label: 'Litros (L)', multiplier: 1000, type: 'volume' },
        { value: 'un', label: 'Unidade(s)', multiplier: 1, type: 'unit' }
    ];

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
            const weeksPerMonth = 4.33;
            const totalHoursPerMonth = days * hours * weeksPerMonth;
            hourlyRateValue = salary / totalHoursPerMonth;
            calculatedHourlyRate.textContent = formatCurrency(hourlyRateValue);
        } else {
            hourlyRateValue = 0;
            calculatedHourlyRate.textContent = 'R$ 0,00';
        }
    }

    function createUnitSelect(className, selectedValue = 'g') {
        const select = document.createElement('select');
        select.className = className;
        unitOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === selectedValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        return select;
    }

    function addMaterialRow(data = {}) {
        const row = document.createElement('div');
        row.className = 'material-row';
        row.style.counterIncrement = 'row-counter';
        
        // 1. Name
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Insumo (Ex: Farinha)';
        nameInput.className = 'mat-name';
        nameInput.value = data.name || '';

        // 2. Price
        const priceInput = document.createElement('input');
        priceInput.type = 'number';
        priceInput.placeholder = 'R$ Pago';
        priceInput.step = '0.01';
        priceInput.min = '0';
        priceInput.className = 'mat-price';
        priceInput.value = data.price || '';

        // 3. Package
        const pkgDiv = document.createElement('div');
        pkgDiv.className = 'input-with-unit';
        const pkgInput = document.createElement('input');
        pkgInput.type = 'number';
        pkgInput.placeholder = 'Qtd Emb.';
        pkgInput.min = '0';
        pkgInput.className = 'mat-pkg';
        pkgInput.value = data.pkg || '';
        const pkgUnit = createUnitSelect('mat-pkg-unit', data.pkgUnit || 'kg');
        pkgDiv.appendChild(pkgInput);
        pkgDiv.appendChild(pkgUnit);

        // 4. Used
        const usedDiv = document.createElement('div');
        usedDiv.className = 'input-with-unit';
        const usedInput = document.createElement('input');
        usedInput.type = 'number';
        usedInput.placeholder = 'Qtd Usada';
        usedInput.min = '0';
        usedInput.className = 'mat-used';
        usedInput.value = data.used || '';
        const usedUnit = createUnitSelect('mat-used-unit', data.usedUnit || 'g');
        usedDiv.appendChild(usedInput);
        usedDiv.appendChild(usedUnit);

        // 5. Cost Display
        const costDisplay = document.createElement('span');
        costDisplay.className = 'row-cost-display';
        costDisplay.textContent = 'R$ 0,00';

        // 6. Remove Button
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
        row.appendChild(pkgDiv);
        row.appendChild(usedDiv);
        row.appendChild(costDisplay);
        row.appendChild(removeBtn);

        materialsList.appendChild(row);
    }

    function getUnitMultiplier(unitValue) {
        const option = unitOptions.find(o => o.value === unitValue);
        return option ? option.multiplier : 1;
    }

    function getUnitType(unitValue) {
        const option = unitOptions.find(o => o.value === unitValue);
        return option ? option.type : 'unit';
    }

    function calculateMaterialsTotal() {
        let total = 0;
        const rows = document.querySelectorAll('.material-row');
        
        rows.forEach(row => {
            const price = parseFloat(row.querySelector('.mat-price').value) || 0;
            const pkg = parseFloat(row.querySelector('.mat-pkg').value) || 0;
            const pkgUnit = row.querySelector('.mat-pkg-unit').value;
            const used = parseFloat(row.querySelector('.mat-used').value) || 0;
            const usedUnit = row.querySelector('.mat-used-unit').value;
            const costDisplay = row.querySelector('.row-cost-display');

            let rowCost = 0;

            if (price > 0 && pkg > 0 && used > 0) {
                // Check if units are compatible (e.g. mass and volume shouldn't mix, but for MVP let's just convert to base units)
                const pkgType = getUnitType(pkgUnit);
                const usedType = getUnitType(usedUnit);
                
                if(pkgType !== usedType && pkgType !== 'unit' && usedType !== 'unit') {
                    // Warning: incompatible units
                    costDisplay.textContent = 'Erro de un.';
                    costDisplay.style.color = 'var(--danger-color)';
                } else {
                    const pkgBase = pkg * getUnitMultiplier(pkgUnit);
                    const usedBase = used * getUnitMultiplier(usedUnit);
                    
                    rowCost = (price / pkgBase) * usedBase;
                    costDisplay.textContent = formatCurrency(rowCost);
                    costDisplay.style.color = 'var(--primary-color)';
                }
            } else {
                costDisplay.textContent = 'R$ 0,00';
                costDisplay.style.color = 'var(--text-muted)';
            }
            
            total += rowCost;
        });
        
        return total;
    }

    function updatePartialMaterialsCost() {
        const total = calculateMaterialsTotal();
        document.getElementById('partial-materials-cost').textContent = formatCurrency(total);
    }

    function calculatePrice() {
        const totalMaterialsCost = calculateMaterialsTotal();
        updatePartialMaterialsCost();

        const timeSpent = parseFloat(document.getElementById('time-spent').value) || 0;
        const laborCost = hourlyRateValue * timeSpent;
        const otherCosts = parseFloat(document.getElementById('other-costs').value) || 0;
        const totalCost = totalMaterialsCost + laborCost + otherCosts;
        const margin = parseFloat(document.getElementById('profit-margin').value) || 0;
        const profit = totalCost * (margin / 100);
        const suggestedPrice = totalCost + profit;

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
                pkgUnit: row.querySelector('.mat-pkg-unit').value,
                used: row.querySelector('.mat-used').value,
                usedUnit: row.querySelector('.mat-used-unit').value
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
