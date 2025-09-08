const form = document.getElementById('form-veiculo');
const btnCadastrar = document.getElementById('btn-cadastrar');
const lista = document.getElementById('lista-veiculos');
const totalVeiculos = document.getElementById('total-veiculos');
const totalVagas = document.getElementById('total-vagas');
const vagasDisponiveis = document.getElementById('vagas-disponiveis');
const comprovante = document.getElementById('comprovante');
const btnNovoDia = document.getElementById('novo-dia');
const btnImprimirExtrato = document.getElementById('btn-imprimir-extrato');
const extratoDia = document.getElementById('extrato-dia');

const LIMITE_VAGAS = 65;
let veiculos = [];
let historicoVeiculos = [];
let valorTotal = 0;

// Carregar do localStorage ao iniciar
if (localStorage.getItem('veiculos')) {
  veiculos = JSON.parse(localStorage.getItem('veiculos'));
}
if (localStorage.getItem('historicoVeiculos')) {
  historicoVeiculos = JSON.parse(localStorage.getItem('historicoVeiculos'));
}

function atualizarDashboard() {
  lista.innerHTML = '';
  veiculos.forEach((v, index) => {
    const item = document.createElement('li');
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.gap = '25px';
    item.innerHTML = `
      <span>${v.placa} - ${v.modelo} (${v.tipo})</span>
      <span>R$ ${v.valor.toFixed(2)}</span>
      <span class="acoes">
        <button class="checkout" onclick="darCheckout(${index})">Checkout</button>
        <button onclick="imprimirComprovante(${index})">Imprimir novamente</button>
      </span>
    `;
    lista.appendChild(item);
  });
  totalVeiculos.textContent = veiculos.length;
  vagasDisponiveis.textContent = LIMITE_VAGAS - veiculos.length;
  // Salva no localStorage
  localStorage.setItem('veiculos', JSON.stringify(veiculos));
  localStorage.setItem('historicoVeiculos', JSON.stringify(historicoVeiculos));
}

function gerarComprovante(veiculo) {
  comprovante.innerHTML = `
    <p style="font-size:1.2rem;font-weight:bold;">Erivan Estacionamento</p>
    <p><strong>CNPJ:</strong> 18.852.143/001-97</p>
    <p><strong>Horário de funcionamento:</strong> 8h às 18h</p>
    <p>Atenção: Após horario, será cobrado taxa adicional de R$40 por hora!</p>
    <hr>
    <p><strong>Placa:</strong> ${veiculo.placa}</p>
    <p><strong>Modelo:</strong> ${veiculo.modelo}</p>
    <p><strong>Tipo:</strong> ${veiculo.tipo.charAt(0).toUpperCase() + veiculo.tipo.slice(1)}</p>
    <p><strong>Data/Hora:</strong> ${veiculo.dataHora}</p>
    <p><strong>Valor:</strong> R$ ${veiculo.valor.toFixed(2)}</p>
    <hr>
    <button onclick="window.print()">Imprimir Cupom</button>
  `;
  comprovante.classList.remove('hidden');
}

function imprimirComprovante(index) {
  gerarComprovante(veiculos[index]);
}

function darCheckout(index) {
  if (confirm('Deseja realmente dar checkout neste veículo?')) {
    veiculos.splice(index, 1);
    atualizarDashboard();
    comprovante.classList.add('hidden');
  }
}

// Função para mostrar notificação visual
function mostrarNotificacao(mensagem, cor = "#198754") {
  let notif = document.getElementById('notificacao-cadastro');
  if (!notif) {
    notif = document.createElement('div');
    notif.id = 'notificacao-cadastro';
    notif.style.position = 'fixed';
    notif.style.top = '30px';
    notif.style.left = '50%';
    notif.style.transform = 'translateX(-50%)';
    notif.style.background = cor;
    notif.style.color = '#fff';
    notif.style.padding = '1rem 2.5rem';
    notif.style.borderRadius = '8px';
    notif.style.fontSize = '1.2rem';
    notif.style.fontWeight = 'bold';
    notif.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
    notif.style.zIndex = '9999';
    notif.style.display = 'none';
    notif.style.transition = 'opacity 0.3s';
    document.body.appendChild(notif);
  }
  notif.textContent = mensagem;
  notif.style.display = 'block';
  notif.style.opacity = '1';
  setTimeout(() => {
    notif.style.opacity = '0';
    setTimeout(() => {
      notif.style.display = 'none';
    }, 300);
  }, 1500);
}

form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (veiculos.length >= LIMITE_VAGAS) {
    alert('Todas as vagas estão ocupadas!');
    return;
  }
  const placa = document.getElementById('placa').value.trim().toUpperCase();
  const modelo = document.getElementById('modelo').value.trim();
  const tipo = document.getElementById('tipo').value;
  if (!placa || !modelo || !tipo) {
    alert('Preencha todos os campos!');
    return;
  }
  const valor = tipo === 'carro' ? 60 : 30;
  const dataHora = new Date().toLocaleString('pt-BR');
  const veiculo = { placa, modelo, tipo, valor, dataHora };
  veiculos.push(veiculo);
  historicoVeiculos.push(veiculo);
  gerarComprovante(veiculo);
  atualizarDashboard();
  form.reset();

  // Feedback visual ao cadastrar
  mostrarNotificacao("Veículo cadastrado com sucesso!");
});

btnNovoDia.addEventListener('click', function() {
  if (confirm('Tem certeza que deseja começar um novo dia? Todos os dados serão apagados!')) {
    veiculos = [];
    historicoVeiculos = [];
    atualizarDashboard();
    comprovante.classList.add('hidden');
    extratoDia.classList.add('hidden');
    localStorage.removeItem('veiculos');
    localStorage.removeItem('historicoVeiculos');
  }
});

btnImprimirExtrato.addEventListener('click', function() {
  if (historicoVeiculos.length === 0) {
    alert('Nenhum veículo registrado hoje!');
    return;
  }
  let html = `<p>EXTRATO DO DIA</p><hr><ul>`;
  historicoVeiculos.forEach(v => {
    html += `<li>${v.placa} - ${v.modelo} (${v.tipo}) - R$ ${v.valor.toFixed(2)} - ${v.dataHora}</li>`;
  });
  html += `</ul><hr><p><strong>Total de veículos:</strong> ${historicoVeiculos.length}</p>`;
  html += `<p><strong>Total arrecadado:</strong> R$ ${(historicoVeiculos.reduce((s, v) => s + v.valor, 0)).toFixed(2)}</p>`;
  extratoDia.innerHTML = html;
  extratoDia.classList.remove('hidden');
  window.print();
});

// Inicialização
atualizarDashboard();