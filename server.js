require('dotenv').config();
const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');
const app = express();

// Config AWS
AWS.config.update({ region: process.env.AWS_REGION });
const dynamoDB = new AWS.DynamoDB.DocumentClient();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Registro de usuario
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const getParams = { TableName: process.env.USERS_TABLE, Key: { username } };

  try {
    const existingUser = await dynamoDB.get(getParams).promise();
    if (existingUser.Item) {
      return res.status(409).json({ error: 'Este usuario ya existe' }); // Error 409 + mensaje
    }

    await dynamoDB.put({
      TableName: process.env.USERS_TABLE,
      Item: { username, password, role: 'user' },
    }).promise();
    
    res.status(201).json({ message: 'Registro exitoso' });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const params = { TableName: process.env.USERS_TABLE, Key: { username } };

  try {
    const data = await dynamoDB.get(params).promise();
    if (!data.Item || data.Item.password !== password) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' }); // Mensaje explícito
    }
    res.json({ role: data.Item.role, username });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Crear Ticket (Usuario)
app.post('/tickets', async (req, res) => {
  const { title, description, username } = req.body;
  const ticket = {
    id: Date.now(),
    title,
    description,
    status: 'open',
    createdBy: username,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    resolvedBy: null,
  };

  const params = { TableName: process.env.TICKETS_TABLE, Item: ticket };
  try {
    await dynamoDB.put(params).promise();
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).send('Error al crear el ticket');
  }
});

// Obtener Tickets (Usuario)
app.get('/tickets/user/:username', async (req, res) => {
  const params = {
    TableName: process.env.TICKETS_TABLE,
    FilterExpression: 'createdBy = :username',
    ExpressionAttributeValues: { ':username': req.params.username },
    ConsistentRead: true // Lectura consistente
  };
  try {
    const data = await dynamoDB.scan(params).promise();
    res.json(data.Items);
  } catch (error) {
    res.status(500).send('Error al obtener tickets');
  }
});

// Obtener Todos los Tickets (Admin)
app.get('/tickets/admin', async (req, res) => {
  const params = {
    TableName: process.env.TICKETS_TABLE,
    ConsistentRead: true // Lectura consistente
  };
  try {
    const data = await dynamoDB.scan(params).promise();
    res.json(data.Items);
  } catch (error) {
    res.status(500).send('Error al obtener tickets');
  }
});

// Actualizar estado del ticket (Admin)
app.put('/tickets/:id', async (req, res) => {
  const { id } = req.params;
  const { status, resolvedBy } = req.body; // Recibir "resolvedBy" desde el frontend

  const updateData = {
      TableName: process.env.TICKETS_TABLE,
      Key: { id: Number(id) },
      UpdateExpression: 'set #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status }
  };

  // Solo si es "resolved", añadir campos extra
  if (status === 'resolved') {
      updateData.UpdateExpression += ', resolvedAt = :resolvedAt, resolvedBy = :resolvedBy';
      updateData.ExpressionAttributeValues[':resolvedAt'] = new Date().toISOString();
      updateData.ExpressionAttributeValues[':resolvedBy'] = resolvedBy; // Usar valor del frontend
  }

  try {
      await dynamoDB.update(updateData).promise();
      res.sendStatus(200);
  } catch (error) {
      res.status(500).send('Error al actualizar');
  }
});


const PORT = 4000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));