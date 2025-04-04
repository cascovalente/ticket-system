// Configuración desde variables de entorno
Amplify.configure({
    Auth: {
      region: process.env.REACT_APP_REGION,
      userPoolId: process.env.REACT_APP_USER_POOL_ID,
      userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
      authenticationFlowType: 'USER_PASSWORD_AUTH'
    }
  });
  
  // URL de la API Gateway
  const API_URL = process.env.REACT_APP_API_URL;

// Función para mostrar/ocultar el menú de usuario
function toggleUserMenu() {
    const dropdown = document.getElementById('menuDropdown');
    if (dropdown) dropdown.classList.toggle('show');
}

async function login(identifier, password) {
    try {
      const user = await Auth.signIn(identifier, password);
      const token = user.signInUserSession.idToken.jwtToken;
      const role = token.payload['custom:role'] || 'user';
      
      // Redirección según rol
      window.location.href = role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
      
    } catch (error) {
      showToast(error.message || 'Credenciales incorrectas', 'error');
    }
  }

  async function register(email, username, password) {
    try {
      await Auth.signUp({
        username: username,
        password: password,
        attributes: {
          email: email,
          'custom:role': 'user'
        }
      });
      showToast('Confirma tu correo electrónico', 'success');
      toggleForms();
    } catch (error) {
      showToast(error.message || 'Error al registrar', 'error');
    }
  }

// Cargar datos del usuario en el dashboard
async function loadUserData() {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const token = user.signInUserSession.idToken.jwtToken;
      const role = token.payload['custom:role'] || 'user';
      
      // Mostrar username en la UI
      document.getElementById('usernameDisplay').textContent = user.username;
      
      // Configurar menú de usuario
      const userMenu = document.getElementById('userMenu');
      if (userMenu) {
        userMenu.addEventListener('click', (e) => {
          e.stopPropagation();
          document.getElementById('menuDropdown').classList.toggle('show');
        });
      }
      
      return { username: user.username, role: role };
      
    } catch (error) {
      window.location.href = 'login.html';
      return null;
    }
  }

// Función unificada para cargar tickets
async function loadTickets() {
    try {
        const { username, role } = await loadUserData() || {};
        if (!username) return;

        const token = (await Auth.currentSession()).idToken.jwtToken;
        const url = role === 'admin' 
            ? `${API_URL}/tickets/admin` 
            : `${API_URL}/tickets/user/${username}`;

        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const tickets = await response.json();
        renderTickets(tickets, role === 'admin' ? '#adminTickets' : '#userTickets');
        
    } catch (error) {
        showToast('Error al cargar tickets', 'error');
    }
}

// Cargar tickets del usuario
async function loadUserTickets() {
    try {
        const { username } = await loadUserData() || {};
        if (!username) return;
        
        const token = (await Auth.currentSession()).idToken.jwtToken;
        const response = await fetch(`${API_URL}/tickets/user/${username}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const tickets = await response.json();
        renderTickets(tickets, '#userTickets');
    } catch (error) {
        console.error('Error al cargar tickets:', error);
    }
}

// Cargar todos los tickets (admin)
async function loadAllTickets() {
    try {
        const token = (await Auth.currentSession()).idToken.jwtToken;
        const response = await fetch(`${API_URL}/tickets/admin`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const tickets = await response.json();
        renderTickets(tickets, '#adminTickets');
    } catch (error) {
        console.error('Error al cargar tickets:', error);
    }
}

// Renderizar tickets
function renderTickets(tickets, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    container.innerHTML = '';

    // Ordenar tickets por fecha (más recientes primero)
    const sortedTickets = tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Crear elementos en orden natural (el grid CSS se encarga del layout)
    sortedTickets.forEach(ticket => {
        const ticketElement = document.createElement('div');
        ticketElement.className = 'ticket-card';
        ticketElement.innerHTML = `
            <h3 class="ticket-title">${truncateText(ticket.title, 30)}</h3>
            <p class="ticket-description">${truncateText(ticket.description, 100)}</p>
            <div class="ticket-meta">
                <p>📅 ${formatDate(ticket.createdAt)}</p>
                <p>👤 ${ticket.createdBy}</p>
                <p class="status-${ticket.status}">${
                    ticket.status === 'open' ? '🟡 Pendiente' : 
                    ticket.status === 'in-progress' ? '🟠 En progreso' : '🟢 Resuelto'
                }</p>
            </div>
        `;
        ticketElement.addEventListener('click', () => showTicketDetails(ticket));
        container.appendChild(ticketElement); // <-- appendChild normal
    });
}


// Funciones auxiliares
function truncateText(text, maxLength) {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Resolver ticket (admin)
window.resolveTicket = async (id) => {
    try {
        const { username } = await loadUserData() || {};
        if (!username) return;
        
        const token = (await Auth.currentSession()).idToken.jwtToken;
        await fetch(`${API_URL}/tickets/resolve/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ resolvedBy: username })
        });
        loadAllTickets();
    } catch (error) {
        console.error('Error al resolver ticket:', error);
    }
};

// Toggle entre formularios de login/registro
window.toggleForms = function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toggleText = document.querySelector('.toggle-form');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        toggleText.innerHTML = '¿No tienes cuenta? <span>Regístrate aquí</span>';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        toggleText.innerHTML = '¿Ya tienes cuenta? <span>Inicia sesión</span>';
    }
};

// Logout
window.logout = async function() {
    try {
      await Auth.signOut();
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    // Login
    if (document.getElementById('loginForm')) {
      document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;
        await login(identifier, password);
        });
    }
    
    // Configurar formulario de registro
    if (document.getElementById('registerForm')) {
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('email').value;
          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;
          await register(email, username, password);
        });
    }
    
    // Cargar datos según la página
    if (window.location.pathname.includes('dashboard')) {
        await loadUserData();
        const savedFilter = localStorage.getItem('ticketFilter') || 'all';
        document.getElementById('filterStatus').value = savedFilter;
        await loadTickets();
    }
});

// Función para mostrar el modal con detalles completos
async function showTicketDetails(ticket) {
    const existingModal = document.querySelector('.ticket-modal');
    if (existingModal) existingModal.remove();

    // Obtener rol del usuario actual
    const user = await Auth.currentAuthenticatedUser();
    const role = user.signInUserSession.idToken.payload['custom:role'] || 'user';

    const modal = document.createElement('div');
    modal.className = 'ticket-modal';
    modal.innerHTML = `
        <div class="ticket-modal-content">
            <h3>${ticket.title}</h3>
            <p class="ticket-description">${ticket.description}</p>
            <div class="ticket-meta">
                <p>🆔 ID: ${ticket.id}</p>
                <p>👤 Creado por: ${ticket.createdBy}</p>
                <p>📅 Fecha: ${formatDate(ticket.createdAt)}</p>
                <p>📌 Estado: ${ticket.status}</p>
            </div>

            <!-- Acciones -->
            <div class="ticket-actions">
                ${role === 'admin' ? `
                    <select class="status-select" id="statusSelect-${ticket.id}" onchange="updateTicketStatus('${ticket.id}')">
                        <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Pendiente</option>
                        <option value="in-progress" ${ticket.status === 'in-progress' ? 'selected' : ''}>En Progreso</option>
                        <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>Resuelto</option>
                    </select>
                ` : ''}
                <button onclick="this.closest('.ticket-modal').remove()">Cerrar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Función para ordenar tickets
function sortTickets(tickets, criteria) {
    return tickets.sort((a, b) => {
        if (criteria === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
        if (criteria === 'id') return b.id - a.id;
        return 0;
    });
}

// Función para cargar tickets de usuario CON filtros
async function loadUserTickets() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`/tickets/user/${currentUser.username}`);
        let tickets = await response.json();
        
        // Aplicar filtros (versión usuario)
        const statusFilter = document.getElementById('userFilterStatus')?.value;
        if (statusFilter && statusFilter !== 'all') {
            tickets = tickets.filter(ticket => ticket.status === statusFilter);
        }
        
        // Aplicar ordenamiento
        const sortBy = document.getElementById('userSortCriteria')?.value;
        tickets = sortTickets(tickets, sortBy);
        
        renderTickets(tickets, '#userTickets');
    } catch (error) {
        console.error('Error al cargar tickets:', error);
    }
}

// Mostrar/ocultar modal
function toggleCreateModal(action) {
    const modal = document.getElementById('createModal');
    if (!modal) return;

    modal.style.display = action === 'show' ? 'block' : 'none';
}

async function createTicket(e) {
    e.preventDefault();
    try {
        const { username } = await loadUserData() || {};
        const token = (await Auth.currentSession()).idToken.jwtToken;
        
        const response = await fetch(`${API_URL}/tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                title: document.getElementById('ticketTitle').value,
                description: document.getElementById('ticketDesc').value,
                username: username // Añadir campo requerido por el backend
            })
        });
        
        if (response.ok) {
            document.getElementById('ticketTitle').value = '';
            document.getElementById('ticketDesc').value = '';
            showToast('Ticket creado ✔️', 'success');
            closeCreateModal();
            await loadTickets();
        }
    } catch (error) {
        showToast('Error al crear el ticket ❌', 'error');
    }
}

// Filtro de tickets
function filterTickets() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const tickets = document.querySelectorAll('.ticket-card');
    
    tickets.forEach(ticket => {
        const title = ticket.querySelector('.ticket-title').textContent.toLowerCase();
        const desc = ticket.querySelector('.ticket-description').textContent.toLowerCase();
        
        // Solo buscar en título y descripción
        const match = title.includes(searchTerm) || desc.includes(searchTerm);
        ticket.style.display = match ? 'block' : 'none';
    });
}

// Notificaciones Toast
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type} visible`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

//Actualizar status del ticket
// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ Modificar función completa ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
window.updateTicketStatus = async (ticketId) => {
    try {
        const { username, role } = await loadUserData() || {};
        if (!username || role !== 'admin') return;
        
        const token = (await Auth.currentSession()).idToken.jwtToken;
        const newStatus = document.getElementById(`statusSelect-${ticketId}`).value;
        
        await fetch(`${API_URL}/tickets/${ticketId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ 
                status: newStatus,
                resolvedBy: newStatus === 'resolved' ? username : null 
            })
        });
        
        document.querySelector('.ticket-modal').remove();
        loadTickets();
        showToast('Estado actualizado ✔️', 'success');
    } catch (error) {
        showToast('Error al actualizar ❌', 'error');
    }
};

function closeCreateModal() {
    const modal = document.getElementById('createModal');
    if (modal) modal.style.display = 'none'; // Ocultar modal en lugar de eliminar
}
