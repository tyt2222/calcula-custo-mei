document.addEventListener('DOMContentLoaded', () => {
    const materialsList = document.getElementById('materials-list');
    const addMaterialBtn = document.getElementById('add-material-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const clearBtn = document.getElementById('clear-btn');
    const shareBtn = document.getElementById('share-whatsapp-btn');
    const resultSection = document.getElementById('result-section');
    const saveStatus = document.getElementById('save-status');

    // Theme logic
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    const currentTheme = localStorage.getItem('theme') || (window.matchMedia("(prefers-color-scheme: dark)").matches ? 'dark' : 'light');
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        if (isDark) {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    });

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

    // Inventory for Auto-complete
    let inventory = [];

    function loadInventory() {
        const raw = localStorage.getItem('calculacusto_mei_inventory');
        if (raw) {
            try {
                inventory = JSON.parse(raw);
            } catch (e) {
                inventory = [];
            }
        }
        updateDatalist();
    }

    function updateDatalist() {
        let datalist = document.getElementById('inventory-list');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'inventory-list';
            document.body.appendChild(datalist);
        }
        datalist.innerHTML = '';
        inventory.forEach(item => {
            const option = document.createElement('option');
            option.value = item.name;
            datalist.appendChild(option);
        });
    }

    function updateInventoryFromCurrent() {
        let inventoryChanged = false;
        document.querySelectorAll('.material-row').forEach(row => {
            const name = row.querySelector('.mat-name').value.trim();
            const price = parseFloat(row.querySelector('.mat-price').value) || 0;
            const pkg = parseFloat(row.querySelector('.mat-pkg').value) || 0;
            const pkgUnit = row.querySelector('.mat-pkg-unit').value;

            if (name && price > 0 && pkg > 0) {
                const existingIndex = inventory.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
                if (existingIndex >= 0) {
                    if (inventory[existingIndex].price !== price || inventory[existingIndex].pkg !== pkg || inventory[existingIndex].pkgUnit !== pkgUnit) {
                        inventory[existingIndex] = { name, price, pkg, pkgUnit };
                        inventoryChanged = true;
                    }
                } else {
                    inventory.push({ name, price, pkg, pkgUnit });
                    inventoryChanged = true;
                }
            }
        });

        if (inventoryChanged) {
            localStorage.setItem('calculacusto_mei_inventory', JSON.stringify(inventory));
            updateDatalist();
        }
    }

    // Initialize
    loadInventory();
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
        
        // 1. Name with Auto-complete
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Insumo (Ex: Farinha)';
        nameInput.className = 'mat-name';
        nameInput.value = data.name || '';
        nameInput.setAttribute('list', 'inventory-list');

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

        // Auto-fill logic when selecting from datalist
        nameInput.addEventListener('change', (e) => {
            const typedName = e.target.value.trim();
            const found = inventory.find(i => i.name.toLowerCase() === typedName.toLowerCase());
            if (found) {
                if (!priceInput.value) priceInput.value = found.price;
                if (!pkgInput.value) pkgInput.value = found.pkg;
                if (pkgUnit.value !== found.pkgUnit) pkgUnit.value = found.pkgUnit;
                updatePartialMaterialsCost();
                saveData();
            }
        });

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
                const pkgType = getUnitType(pkgUnit);
                const usedType = getUnitType(usedUnit);
                
                if(pkgType !== usedType && pkgType !== 'unit' && usedType !== 'unit') {
                    costDisplay.textContent = 'Erro un.';
                    costDisplay.style.color = 'var(--danger-color)';
                } else {
                    const pkgBase = pkg * getUnitMultiplier(pkgUnit);
                    const usedBase = used * getUnitMultiplier(usedUnit);
                    
                    rowCost = (price / pkgBase) * usedBase;
                    costDisplay.textContent = formatCurrency(rowCost);
                    costDisplay.style.color = ''; // reset to css default
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
        updateInventoryFromCurrent(); // update datalist
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
        if(confirm('Tem certeza que deseja limpar todos os dados do produto atual? (O inventário de insumos não será apagado)')) {
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

    // --- OCR Logic ---
    const receiptUpload = document.getElementById('receipt-upload');
    const btnUploadReceipt = document.getElementById('btn-upload-receipt');
    const ocrLoading = document.getElementById('ocr-loading');
    const ocrResults = document.getElementById('ocr-results');
    const ocrItemsList = document.getElementById('ocr-items-list');

    if(btnUploadReceipt) {
        btnUploadReceipt.addEventListener('click', () => receiptUpload.click());
    }

    if(receiptUpload) {
        receiptUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if(!file) return;

            ocrLoading.classList.remove('hidden');
            ocrResults.classList.add('hidden');
            ocrItemsList.innerHTML = '';

            try {
                let imageUrl = '';
                
                if (file.type === 'application/pdf') {
                    // PDF setup
                    const pdfjsLib = window['pdfjs-dist/build/pdf'];
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
                    
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
                    const page = await pdf.getPage(1); // Le a 1a página do PDF
                    const viewport = page.getViewport({scale: 2.0});
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    await page.render({canvasContext: context, viewport: viewport}).promise;
                    imageUrl = canvas.toDataURL('image/png');
                } else {
                    imageUrl = URL.createObjectURL(file);
                }

                const result = await Tesseract.recognize(
                    imageUrl,
                    'por', // Portuguese
                    { logger: m => console.log(m) }
                );

                const lines = result.data.lines.map(l => l.text.trim()).filter(l => l.length > 0);
                parseReceiptLines(lines);

            } catch (err) {
                console.error(err);
                alert('Erro ao processar o documento. Tente novamente com uma imagem mais nítida.');
            } finally {
                ocrLoading.classList.add('hidden');
                receiptUpload.value = ''; 
            }
        });
    }

    function parseReceiptLines(lines) {
        const items = [];
        // Tenta achar padrões com preços no final da linha, permitindo lixo não numérico no fim como ")", "]"
        const priceRegex = /(\d+[.,]\d{2})[^\d]*$/i;
        
        lines.forEach(line => {
            const match = line.match(priceRegex);
            if(match) {
                let name = line.replace(priceRegex, '').trim();
                // Limpeza basica de lixo comum no início (ex: 001 123456)
                name = name.replace(/^[\d\s*X*-]+/, '').trim(); 
                
                // Remove termos indesejados comuns no final do nome que indicam a unidade (ex: 1un F1, 1un T19)
                name = name.replace(/\d+\s*(?:un|cx|pc)\s*.*$/i, '').trim();

                if(name.length > 2) {
                    const price = parseFloat(match[1].replace(',', '.'));
                    // Ignora linhas que obviamente não são produtos (como SUBTOTAL, TOTAL, TEF, TROCO)
                    const upperName = name.toUpperCase();
                    if(upperName.includes('TOTAL') || upperName.includes('SUBTOTAL') || upperName.includes('TROCO') || upperName.includes('DINHEIRO') || upperName.includes('CARTAO')) {
                        return; // Pula essa iteração
                    }

                    // Tenta adivinhar tamanho se houver algo como "1KG" ou "500G" no nome original
                    let pkg = 1;
                    let pkgUnit = 'un';
                    
                    const kgMatch = line.match(/(\d+[.,]?\d*)\s*KG/i);
                    const gMatch = line.match(/(\d+[.,]?\d*)\s*G(?!\w)/i);
                    const lMatch = line.match(/(\d+[.,]?\d*)\s*L(?!\w)/i);
                    const mlMatch = line.match(/(\d+[.,]?\d*)\s*ML/i);
                    
                    if (kgMatch) { pkg = parseFloat(kgMatch[1].replace(',','.')); pkgUnit = 'kg'; }
                    else if (gMatch) { pkg = parseFloat(gMatch[1].replace(',','.')); pkgUnit = 'g'; }
                    else if (lMatch) { pkg = parseFloat(lMatch[1].replace(',','.')); pkgUnit = 'l'; }
                    else if (mlMatch) { pkg = parseFloat(mlMatch[1].replace(',','.')); pkgUnit = 'ml'; }
                    
                    items.push({ name, price, pkg, pkgUnit });
                }
            }
        });

        if(items.length > 0) {
            renderOcrItems(items);
            ocrResults.classList.remove('hidden');
        } else {
            alert('Não foi possível extrair produtos com preços. Verifique a nitidez ou digite manualmente.');
        }
    }

    function renderOcrItems(items) {
        ocrItemsList.innerHTML = '';
        items.forEach((item) => {
            const row = document.createElement('div');
            row.className = 'ocr-item-row';
            
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = item.name;
            nameInput.className = 'ocr-name';
            nameInput.placeholder = 'Nome do Produto';
            
            const priceInput = document.createElement('input');
            priceInput.type = 'number';
            priceInput.step = '0.01';
            priceInput.value = item.price;
            priceInput.className = 'ocr-price';
            priceInput.title = 'Preço';
            
            const pkgInput = document.createElement('input');
            pkgInput.type = 'number';
            pkgInput.value = item.pkg;
            pkgInput.className = 'ocr-pkg';
            pkgInput.title = 'Qtd Emb.';
            
            const unitSelect = createUnitSelect('ocr-unit', item.pkgUnit);
            
            const saveBtn = document.createElement('button');
            saveBtn.className = 'btn-secondary btn-sm';
            saveBtn.textContent = 'Salvar no Estoque';
            saveBtn.onclick = () => {
                const n = nameInput.value.trim();
                const p = parseFloat(priceInput.value) || 0;
                const pkg = parseFloat(pkgInput.value) || 0;
                const u = unitSelect.value;
                if(n && p > 0 && pkg > 0) {
                    saveToInventory(n, p, pkg, u);
                    row.style.opacity = '0.5';
                    saveBtn.textContent = 'Salvo!';
                    saveBtn.disabled = true;
                } else {
                    alert('Preencha todos os campos do produto corretamente para salvar.');
                }
            };
            
            row.appendChild(nameInput);
            row.appendChild(priceInput);
            row.appendChild(pkgInput);
            row.appendChild(unitSelect);
            row.appendChild(saveBtn);
            
            ocrItemsList.appendChild(row);
        });
    }

    function saveToInventory(name, price, pkg, pkgUnit) {
        const existingIndex = inventory.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
        if (existingIndex >= 0) {
            inventory[existingIndex] = { name, price, pkg, pkgUnit };
        } else {
            inventory.push({ name, price, pkg, pkgUnit });
        }
        localStorage.setItem('calculacusto_mei_inventory', JSON.stringify(inventory));
        updateDatalist();
    }
});
