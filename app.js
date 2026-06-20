document.addEventListener('DOMContentLoaded', () => {
    // Ekranlar
    const homeScreen = document.getElementById('homeScreen');
    const wizardScreen = document.getElementById('wizardScreen');
    const listScreen = document.getElementById('listScreen');
    
    // Butonlar
    const btnOpenWizard = document.getElementById('btnOpenWizard');
    const btnOpenList = document.getElementById('btnOpenList');
    const productList = document.getElementById('productList');
    
    // Sihirbaz Değişkenleri
    const steps = ['step-0', 'step-1', 'step-2', 'step-3', 'step-4'];
    const titles = ['Ürün Adı', 'Gün (1-31)', 'Ay (1-12)', 'Yıl', 'Uyarı Kategorisi'];
    let currentStep = 0;

    // Veritabanı ve Akıllı Hafıza
    let products = JSON.parse(localStorage.getItem('sktProducts')) || [];
    let memory = JSON.parse(localStorage.getItem('sktMemory')) || {};

    // PWA Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW Hatası:', err));
    }

    // --- NAVİGASYON MOTORU ---
    window.goHome = () => {
        wizardScreen.classList.add('hidden');
        listScreen.classList.add('hidden');
        homeScreen.classList.remove('hidden');
    };

    btnOpenWizard.addEventListener('click', () => {
        homeScreen.classList.add('hidden');
        wizardScreen.classList.remove('hidden');
        
        // Akıllı Tahmin (Datalist) Güncelleme
        updateDatalist();

        // Formu temizle ve bugüne ayarla
        document.getElementById('wName').value = '';
        document.getElementById('wDay').value = '';
        document.getElementById('wMonth').value = new Date().getMonth() + 1;
        document.getElementById('wYear').value = new Date().getFullYear();

        goToStep(0);
    });

    btnOpenList.addEventListener('click', () => {
        homeScreen.classList.add('hidden');
        listScreen.classList.remove('hidden');
        renderProducts();
    });

    // --- AKILLI TAHMİN (DATALİST) ---
    function updateDatalist() {
        const dataList = document.getElementById('productHistory');
        dataList.innerHTML = '';
        Object.keys(memory).forEach(productName => {
            const option = document.createElement('option');
            option.value = productName;
            dataList.appendChild(option);
        });
    }

    // --- SİHİRBAZ VE AKILLI TESPİT MOTORU ---
    function goToStep(stepIndex) {
        document.getElementById(steps[currentStep]).classList.add('hidden');
        currentStep = stepIndex;
        document.getElementById(steps[currentStep]).classList.remove('hidden');
        document.getElementById('wizardTitle').innerText = titles[currentStep];

        const input = document.getElementById(steps[currentStep]).querySelector('input');
        if (input) {
            input.focus();
            input.select();
            document.getElementById('helpText').classList.remove('hidden');
        } else {
            document.getElementById('helpText').classList.add('hidden');
        }
    }

    document.querySelectorAll('.wizard-input').forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.value.trim() !== '') {
                    // 3. Adım (Yıl) geçildikten sonra AKILLI TESPİT kontrolü
                    if (currentStep === 3) {
                        const productName = document.getElementById('wName').value.trim();
                        // Eğer ürün hafızada varsa, 4. adımı atla ve direkt kaydet!
                        if (memory[productName]) {
                            saveProduct(memory[productName]);
                            return;
                        }
                    }
                    goToStep(currentStep + 1);
                }
            }
        });
    });

    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const warningDays = parseInt(this.getAttribute('data-days'));
            saveProduct(warningDays);
        });
    });

    function saveProduct(warningDays) {
        const name = document.getElementById('wName').value.trim();
        const day = document.getElementById('wDay').value.padStart(2, '0');
        const month = document.getElementById('wMonth').value.padStart(2, '0');
        const year = document.getElementById('wYear').value;
        const dateStr = `${year}-${month}-${day}`;

        // Akıllı Hafızaya Kaydet (Öğrenme)
        memory[name] = warningDays;
        localStorage.setItem('sktMemory', JSON.stringify(memory));

        // Ürünü Listeye Ekle
        products.push({ name: name, date: dateStr, warningCategory: warningDays });
        localStorage.setItem('sktProducts', JSON.stringify(products));
        
        // İşlem bitince Ana Ekrana dön
        goHome();
    }

    // --- LİSTELEME VE UYARI MOTORU ---
    function renderProducts() {
        productList.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        products.sort((a, b) => new Date(a.date) - new Date(b.date));

        products.forEach((product, index) => {
            const expDate = new Date(product.date);
            const diffTime = expDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const li = document.createElement('li');
            li.className = 'product-item';

            if (diffDays <= product.warningCategory) {
                li.classList.add('danger-flash');
            }

            // Sadece Ürün İsmi, SKT ve Sil Butonu
            li.innerHTML = `
                <div>
                    <div style="font-size:1.5rem; font-weight:bold;">${product.name}</div>
                    <div style="font-size:0.9rem; margin-top:5px; opacity:0.9;">SKT: ${product.date}</div>
                </div>
                <button class="delete-btn" onclick="deleteProduct(${index})">SİL</button>
            `;
            productList.appendChild(li);
        });
    }

    window.deleteProduct = (index) => {
        products.splice(index, 1);
        localStorage.setItem('sktProducts', JSON.stringify(products));
        renderProducts();
    };
});
      
