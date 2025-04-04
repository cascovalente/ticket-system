import json
import os
from datetime import datetime
from dynamo_utils import create_ticket

def lambda_handler(event, context):
    try:
        # Obtener usuario de Cognito
        username = event['requestContext']['authorizer']['claims']['cognito:username']
        
        # Parsear datos del body
        body = json.loads(event['body'])
        ticket_data = {
            'id': int(datetime.now().timestamp() * 1000),  # ID único
            'title': body['title'],
            'description': body['description'],
            'status': 'open',
            'createdBy': username,
            'createdAt': datetime.now().isoformat(),
            'resolvedAt': None,
            'resolvedBy': None
        }
        
        # Guardar en DynamoDB
        create_ticket(ticket_data)
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(ticket_data)
        }
        
    except Exception as e:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': str(e)})
        }