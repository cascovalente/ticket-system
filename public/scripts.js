let currentUser = null;

// Función para guardar el usuario en sessionStorage
function setCurrentUser(user) {
    currentUser = user;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
}

// Función para cargar el usuario desde sessionStorage
function loadCurrentUser() {
    const userData = sessionStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
}

// Función para mostrar/ocultar el menú de usuario
function toggleUserMenu() {
    const dropdown = document.getElementById('menuDropdown');
    if (dropdown) dropdown.classList.toggle('show');
}

// Cargar datos del usuario en el dashboard
function loadUserData() {
    currentUser = loadCurrentUser();
    const usernameDisplay = document.getElementById('usernameDisplay');
    
    if (!currentUser || !usernameDisplay) {
        window.location.href = 'login.html';
        return;
    }
    
    usernameDisplay.textContent = currentUser.username;
    
    // Configurar evento para el menú de usuario
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleUserMenu();
        });
    }
    
    // Cerrar menú al hacer clic en cualquier lugar
    document.addEventListener('DOMContentLoaded', () => {
    // Verificar si hay usuario logueado
    currentUser = loadCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
        const dropdown = document.getElementById('menuDropdown');
        if (dropdown) dropdown.classList.remove('show');
    });
}

// Función unificada para cargar tickets
async function loadTickets() {
    try {
        let tickets = [];
        
        if (currentUser?.role === 'admin') {
            const response = await fetch('/tickets/admin');
            tickets = await response.json();
        } else {
            const response = await fetch(`/tickets/user/${currentUser.username}`);
            tickets = await response.json();
        }

        // Aplicar filtro de estado
        const statusFilter = document.getElementById('filterStatus').value;
        if (statusFilter !== 'all') {
            tickets = tickets.filter(ticket => ticket.status === statusFilter);
        }

        renderTickets(tickets, currentUser?.role === 'admin' ? '#adminTickets' : '#userTickets');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Cargar tickets del usuario
async function loadUserTickets() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`/tickets/user/${currentUser.username}`);
        const tickets = await response.json();
        renderTickets(tickets, '#userTickets');
    } catch (error) {
        console.error('Error al cargar tickets:', error);
    }
}

// Cargar todos los tickets (admin)
async function loadAllTickets() {
    try {
        const response = await fetch('/tickets/admin');
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
    
    tickets.forEach(ticket => {
        const ticketElement = document.createElement('div');
        ticketElement.className = 'ticket-card';
        ticketElement.innerHTML = `
            <h3 class="ticket-title">${truncateText(ticket.title, 30)}</h3>
            <p class="ticket-description">${truncateText(ticket.description, 100)}</p>
            <div class="ticket-meta">
                <p>📅 ${formatDate(ticket.createdAt)}</p>
                <p>👤 ${ticket.createdBy}</p>
                <p class="status-${ticket.status}">${ticket.status === 'open' ? '🟡 Pendiente' : ticket.status === 'in-progress' ? '🟠 En progreso' : '🟢 Resuelto'}</p>
            </div>
        `;
        ticketElement.addEventListener('click', () => showTicketDetails(ticket));
        container.appendChild(ticketElement);
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
    if (!currentUser) return;
    
    try {
        await fetch(`/tickets/resolve/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolvedBy: currentUser.username }),
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
    const toggleText = document.querySelector('.toggle-form span');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        toggleText.textContent = 'Regístrate aquí';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        toggleText.textContent = 'Inicia sesión aquí';
    }
};

// Logout
window.logout = function() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
};

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Configurar formulario de login
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });
                
                if (response.ok) {
                    const user = await response.json();
                    setCurrentUser(user);
                    window.location.href = user.role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
                } else {
                    alert('Credenciales incorrectas');
                }
            } catch (error) {
                console.error('Error al iniciar sesión:', error);
                alert('Error al conectar con el servidor');
            }
        });
    }
    
    // Configurar formulario de registro
    if (document.getElementById('registerForm')) {
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('newUsername').value;
            const password = document.getElementById('newPassword').value;
            
            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });
                
                if (response.ok) {
                    alert('Registro exitoso. Por favor inicia sesión.');
                    toggleForms();
                } else {
                    alert('Error al registrar usuario');
                }
            } catch (error) {
                console.error('Error al registrar:', error);
                alert('Error al conectar con el servidor');
            }
        });
    }
    
    // Cargar datos según la página
    if (window.location.pathname.includes('dashboard')) {
        loadUserData();
        if (currentUser?.role === 'user') loadUserTickets();
        else if (currentUser?.role === 'admin') loadAllTickets();
    }
});

// Función para mostrar el modal con detalles completos
function showTicketDetails(ticket) {
        const existingModal = document.querySelector('.ticket-modal');
        if (existingModal) existingModal.remove();

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

            <!-- Dropdown y botones SOLO para admin -->
             ${currentUser?.role === 'admin' ? `
                <div class="ticket-actions">
                    <select class="status-select" id="statusSelect-${ticket.id}" onchange="updateTicketStatus(${ticket.id})">
                        <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Pendiente</option>
                        <option value="in-progress" ${ticket.status === 'in-progress' ? 'selected' : ''}>En Progreso</option>
                        <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>Resuelto</option>
                    </select>
                    <button onclick="this.closest('.ticket-modal').remove()">Cerrar</button>
                </div>
            ` : ''}
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
    const title = document.getElementById('ticketTitle').value;
    const description = document.getElementById('ticketDesc').value;
    
    try {
        const response = await fetch('/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                title, 
                description, 
                username: currentUser.username 
            }),
        });

        if (response.ok) {
            // Limpiar campos y cerrar modal
            document.getElementById('ticketTitle').value = '';
            document.getElementById('ticketDesc').value = '';
            closeCreateModal(); // <-- Cerrar modal aquí
            showToast('Ticket creado ✔️', 'success');
            loadTickets();
        } else {
            // Mostrar error si el servidor responde con código no-200
            showToast('Error al crear ticket ❌', 'error');
        }
    } catch (error) {
        // Mostrar error si hay fallo de conexión
        showToast('Error de conexión ❌', 'error');
    }
}

// Crear ticket
async function createTicket(e) {
    e.preventDefault();
    const title = document.getElementById('ticketTitle').value;
    const description = document.getElementById('ticketDesc').value;
    
    try {
        const response = await fetch('/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                title, 
                description, 
                username: currentUser.username 
            }),
        });

        if (response.ok) {
            document.getElementById('ticketTitle').value = '';
            document.getElementById('ticketDesc').value = '';
            showToast('Ticket creado exitosamente', 'success');
            closeCreateModal();
            if (currentUser.role === 'admin') loadAllTickets();
            else loadUserTickets();
        }
    } catch (error) {
        showToast('Error al crear el ticket', 'error');
    }
}

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

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type} visible`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

window.updateTicketStatus = async (ticketId) => {
    const newStatus = document.getElementById(`statusSelect-${ticketId}`).value;
    
    try {
        await fetch(`/tickets/${ticketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status: newStatus,
                resolvedBy: newStatus === 'resolved' ? currentUser.username : null // Enviar solo si es necesario
            }),
        });
        
        // Recargar tickets y cerrar modal
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