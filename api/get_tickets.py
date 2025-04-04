import json
from dynamo_utils import get_user_tickets, get_all_tickets

def lambda_handler(event, context):
    try:
        # Obtener rol del usuario
        user_role = event['requestContext']['authorizer']['claims'].get('custom:role', 'user')
        username = event['requestContext']['authorizer']['claims']['cognito:username']
        
        # Obtener tickets según rol
        if user_role == 'admin':
            tickets = get_all_tickets()
        else:
            tickets = get_user_tickets(username)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(tickets)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }