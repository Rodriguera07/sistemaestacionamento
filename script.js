document.addEventListener('DOMContentLoaded', () => {
    const ParkingApp = {
        // --- Configurações e Estado ---
        config: {
            totalSpots: 60, // Alterado para 60 vagas
            storageKey: 'erivanParkingState',
        },
        state: {
            spots: [],
            spotToCheckout: null,
            caixaTotal: 0,
            totalCarrosDia: 0, // total de carros registrados no dia
            totalMotosDia: 0   // total de motos registrados no dia
        },

        // --- Seletores de DOM ---
        nodes: {
            parkingLot: document.getElementById('parking-lot'),
            form: document.getElementById('entry-form'),
            modal: {
                element: document.getElementById('checkout-modal'),
                content: document.getElementById('checkout-content'),
            },
        },

        // --- Inicialização ---
        init() {
            this.loadState();
            this.addEventListeners(); // <-- Adicione esta linha!
            this.render();

            // Botão imprimir cupom
            const btnImprimir = document.getElementById('btn-imprimir-cupom');
            if (btnImprimir) {
                btnImprimir.onclick = () => window.print();
            }

            // Botão gerar cupom fiscal
            const btnGerarCupom = document.getElementById('btn-gerar-cupom');
            if (btnGerarCupom) {
                btnGerarCupom.onclick = () => {
                    btnGerarCupom.style.display = 'none';
                    document.getElementById('btn-imprimir-cupom').style.display = 'block';
                };
            }

            const btnFecharDia = document.getElementById('btn-fechar-dia');
            if (btnFecharDia) {
                btnFecharDia.onclick = () => ParkingApp.fecharDia();
            }

            const btnNovoDia = document.getElementById('btn-novo-dia');
            if (btnNovoDia) {
                btnNovoDia.onclick = () => ParkingApp.novoDia();
            }
        },

        // --- Lógica de Renderização ---
        render() {
            this.nodes.parkingLot.innerHTML = ''; // Limpa a visualização
            this.state.spots.forEach(spot => {
                const spotElement = this.createSpotElement(spot);
                this.nodes.parkingLot.appendChild(spotElement);
            });
            this.saveState();

            // Atualiza o fluxo de caixa
            this.updateFluxoCaixa();
        },

        updateFluxoCaixa() {
            let totalCarro = 0;
            let totalMoto = 0;
            // Conta apenas quantidade de carros/motos ocupados
            this.state.spots.forEach(spot => {
                if (spot.status === 'occupied' && spot.vehicle) {
                    if (spot.vehicle.tipo === 'carro') totalCarro += 1;
                    if (spot.vehicle.tipo === 'moto') totalMoto += 1;
                }
            });
            // Mostra o valor total acumulado no dia
            document.getElementById('caixa-carro').textContent = `Carros: ${totalCarro}`;
            document.getElementById('caixa-moto').textContent = `Motos: ${totalMoto}`;
            document.getElementById('caixa-total').textContent = `Total do caixa: R$ ${this.state.caixaTotal.toFixed(2)}`;
        },

        createSpotElement(spot) {
            const el = document.createElement('div');
            el.classList.add('parking-spot', spot.status);
            el.dataset.spotId = spot.id;

            let content = `<div class="spot-id">${spot.id}</div>`;
            if (spot.status === 'occupied') {
                content += `<div class="spot-plate">${spot.vehicle.placa}</div>`;
            }
            el.innerHTML = content;
            // O evento de clique será tratado por delegação no elemento 'parking-lot'

            return el;
        },

        // --- Manipuladores de Eventos ---
        addEventListeners() {
            this.nodes.form.addEventListener('submit', this.handleEntry.bind(this));
            this.nodes.parkingLot.addEventListener('click', this.handleSpotClick.bind(this));
            // Os listeners do modal são adicionados dinamicamente pois o conteúdo é recriado.
        },

        handleEntry(e) {
            e.preventDefault();
            const formData = new FormData(this.nodes.form);
            const vehicle = {
                placa: formData.get('placa').toUpperCase(),
                tipo: formData.get('tipo'),
                modelo: formData.get('modelo'),
                entryTime: new Date(),
            };

            const availableSpot = this.state.spots.find(spot => spot.status === 'available');
            if (!availableSpot) {
                alert('Estacionamento lotado!');
                return;
            }

            availableSpot.status = 'occupied';
            availableSpot.vehicle = vehicle;

            // Acumula valores e quantidades do dia
            if (vehicle.tipo === 'carro') {
                this.state.caixaTotal += 60;
                this.state.totalCarrosDia += 1;
            }
            if (vehicle.tipo === 'moto') {
                this.state.caixaTotal += 30;
                this.state.totalMotosDia += 1;
            }

            this.nodes.form.reset();
            this.render();

            // Exibe área do cupom e botão de gerar cupom fiscal
            const cupomArea = document.getElementById('cupom-area');
            const btnGerarCupom = document.getElementById('btn-gerar-cupom');
            const btnImprimirCupom = document.getElementById('btn-imprimir-cupom');
            cupomArea.style.display = 'block';
            btnGerarCupom.style.display = 'block';
            btnImprimirCupom.style.display = 'none';

            // Gera cupom fiscal (apenas visual, impressão só após clicar)
            this.generateCupom(vehicle, availableSpot.id);

            // Notificação de check-in
            const notification = document.getElementById('checkin-notification');
            notification.style.display = 'block';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 2000); // Notificação some após 2 segundos
        },

        generateCupom(vehicle, spotId) {
            const tipoVeiculo = vehicle.tipo === 'carro' ? 'Carro - R$60,00' : 'Moto - R$30,00';
            const valor = vehicle.tipo === 'carro' ? 'R$60,00' : 'R$30,00';
            const cupomDiv = document.getElementById('cupom');
            cupomDiv.innerHTML = `
                <h2>ERIVAN ESTACIONAMENTO<br>CNPJ:18.852.143/0001-97<br>
                Av.Tomé de Souza, 3489 - JD. Rio da Praia.</h2>
                <hr>
                <p><strong>Vaga:</strong> ${spotId}</p>
                <p><strong>Placa:</strong> ${vehicle.placa}</p>
                <p><strong>Tipo:</strong> ${tipoVeiculo}</p>
                <p><strong>Modelo:</strong> ${vehicle.modelo}</p>
                <p><strong>Entrada:</strong> ${new Date(vehicle.entryTime).toLocaleString('pt-BR')}</p>
                <p><strong>Valor:</strong> ${valor}</p>
                <hr>
                <p>Bem-vindo! Guarde este cupom.<br>Horário de funcionamento 8h as 18h!<br>proibido saida
                do veiculo dentro do periodo estacionado, exceto em caso de emergencia.<br>Não trabalhamos por Hora</p>
            `;
        },

        handleSpotClick(e) {
            const spotDiv = e.target.closest('.parking-spot');
            if (!spotDiv) return;
            const spotId = Number(spotDiv.dataset.spotId);
            const spot = this.state.spots.find(s => s.id == spotId);
            if (!spot || spot.status !== 'occupied') return;

            this.state.spotToCheckout = spotId;
            const vehicle = spot.vehicle;
            const tipoVeiculo = vehicle.tipo === 'carro' ? 'Carro - R$60,00' : 'Moto - R$30,00';
            const valor = vehicle.tipo === 'carro' ? 'R$60,00' : 'R$30,00';

            if (this.nodes.modal.element.open) this.nodes.modal.element.close();

            this.nodes.modal.content.innerHTML = `
                <h3>Checkout da Vaga ${spotId}</h3>
                <p><strong>Placa:</strong> ${vehicle.placa}</p>
                <p><strong>Tipo:</strong> ${tipoVeiculo}</p>
                <p><strong>Modelo:</strong> ${vehicle.modelo}</p>
                <p><strong>Entrada:</strong> ${new Date(vehicle.entryTime).toLocaleString('pt-BR')}</p>
                <p><strong>Valor:</strong> ${valor}</p>
                <div style="margin-top:1.5rem; display:flex; gap:1rem; justify-content:center;">
                    <button type="button" id="btn-reimprimir-cupom" class="btn btn-success">Reimprimir Cupom</button>
                    <button type="button" id="btn-confirm-checkout" class="btn btn-danger">Confirmar Checkout</button>
                    <button type="button" id="btn-cancel-checkout" class="btn btn-secondary">Cancelar</button>
                </div>
            `;

            this.nodes.modal.element.showModal();

            document.getElementById('btn-reimprimir-cupom').onclick = () => {
                this.generateCupom(vehicle, spotId);
                document.getElementById('cupom-area').style.display = 'block';
                document.getElementById('btn-gerar-cupom').style.display = 'none';
                document.getElementById('btn-imprimir-cupom').style.display = 'block';
                this.nodes.modal.element.close();
            };
            document.getElementById('btn-confirm-checkout').onclick = () => {
                this.handleCheckout();
                this.nodes.modal.element.close();
            };
            document.getElementById('btn-cancel-checkout').onclick = () => this.nodes.modal.element.close();
        },

        handleCheckout() {
            if (!this.state.spotToCheckout) return;

            const spot = this.state.spots.find(s => String(s.id) === String(this.state.spotToCheckout));
            if (!spot) return;

            spot.status = 'available';
            spot.vehicle = null;
            this.state.spotToCheckout = null;

            this.nodes.modal.element.close();
            this.render();
        },

        fecharDia() {
            // Usa os acumuladores do dia
            const carros = this.state.totalCarrosDia;
            const motos = this.state.totalMotosDia;
            const total = this.state.caixaTotal;

            const fechamentoContent = document.getElementById('fechamento-content');
            fechamentoContent.innerHTML = `
                <h2>Fechamento do Dia</h2>
                <p><strong>Carros registrados:</strong> ${carros}</p>
                <p><strong>Motos registradas:</strong> ${motos}</p>
                <p><strong>Total do caixa:</strong> R$ ${total.toFixed(2)}</p>
                <div style="margin-top:1rem;">
                    <button id="btn-fechar-modal" type="button">Fechar</button>
                </div>
            `;

            const fechamentoModal = document.getElementById('fechamento-modal');
            fechamentoModal.showModal();

            document.getElementById('btn-fechar-modal').onclick = () => fechamentoModal.close();
        },

        novoDia() {
            // Monta resumo do dia antes de zerar
            const carros = this.state.totalCarrosDia;
            const motos = this.state.totalMotosDia;
            const total = this.state.caixaTotal;

            const novoDiaContent = document.getElementById('novo-dia-content');
            novoDiaContent.innerHTML = `
                <h2>Resumo do Dia</h2>
                <p><strong>Carros registrados:</strong> ${carros}</p>
                <p><strong>Motos registradas:</strong> ${motos}</p>
                <p><strong>Total do caixa:</strong> R$ ${total.toFixed(2)}</p>
                <hr>
                <p style="color:#dc3545; font-weight:bold;">
                    Atenção: Ao confirmar, todo o histórico, fluxo de caixa e vagas ocupadas serão zerados.<br>
                    Deseja realmente começar um novo dia?
                </p>
                <div style="margin-top:1.5rem; display:flex; gap:1rem; justify-content:center;">
                    <button id="btn-imprimir-resumo-dia" type="button" class="btn btn-success">Imprimir Resumo</button>
                    <button id="btn-confirm-novo-dia" type="button" class="btn btn-danger">Confirmar Novo Dia</button>
                    <button id="btn-cancel-novo-dia" type="button" class="btn btn-secondary">Cancelar</button>
                </div>
            `;

            const novoDiaModal = document.getElementById('novo-dia-modal');
            novoDiaModal.showModal();

            // Botão para imprimir o resumo
            document.getElementById('btn-imprimir-resumo-dia').onclick = () => {
                const printWindow = window.open('', '', 'width=400,height=600');
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>Resumo do Dia</title>
                        <style>
                            body { font-family: 'Courier New', Courier, monospace; padding: 2rem; text-align: center; }
                            h2 { color: #dc3545; }
                            p { font-size: 1.1rem; margin: 0.7rem 0; }
                        </style>
                    </head>
                    <body>
                        <h2>Resumo do Dia</h2>
                        <p><strong>Carros registrados:</strong> ${carros}</p>
                        <p><strong>Motos registradas:</strong> ${motos}</p>
                        <p><strong>Total do caixa:</strong> R$ ${total.toFixed(2)}</p>
                    </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.print();
                printWindow.close();
            };

            // Botão para confirmar e zerar tudo
            document.getElementById('btn-confirm-novo-dia').onclick = () => {
                // Zera todos os dados do dia e vagas ocupadas
                this.state.spots.forEach(spot => {
                    spot.status = 'available';
                    spot.vehicle = null;
                });
                this.state.caixaTotal = 0;
                this.state.totalCarrosDia = 0;
                this.state.totalMotosDia = 0;
                this.state.spotToCheckout = null;
                this.render();
                novoDiaModal.close();
            };

            // Botão para cancelar
            document.getElementById('btn-cancel-novo-dia').onclick = () => novoDiaModal.close();
        },

        // --- Persistência de Dados (localStorage) ---
        loadState() {
            const savedState = localStorage.getItem(this.config.storageKey);
            if (savedState) {
                this.state.spots = JSON.parse(savedState);
                // Garante que sempre existam 60 vagas
                if (this.state.spots.length < this.config.totalSpots) {
                    for (let i = this.state.spots.length + 1; i <= this.config.totalSpots; i++) {
                        this.state.spots.push({
                            id: `${i}`,
                            status: 'available',
                            vehicle: null
                        });
                    }
                }
            } else {
                // Cria o estado inicial se não houver nada salvo
                this.state.spots = Array.from({ length: this.config.totalSpots }, (_, i) => ({
                    id: `${i + 1}`,
                    status: 'available', // 'available' ou 'occupied'
                    vehicle: null,
                }));
            }
        },

        saveState() {
            localStorage.setItem(this.config.storageKey, JSON.stringify(this.state.spots));
        },
    };

    ParkingApp.init();

    // Preenche o select de tipo de veículo ao carregar a página
    const tipoSelect = document.getElementById('tipo');
    if (tipoSelect) {
        tipoSelect.innerHTML = `
            <option value="" disabled selected>Selecione</option>
            <option value="carro">Carro - R$60,00</option>
            <option value="moto">Moto - R$30,00</option>
        `;
    }
});