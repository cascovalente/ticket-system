import json
from dynamo_utils import update_ticket_status

def lambda_handler(event, context):
    try:
        # Validar rol de admin
        user_role = event['requestContext']['authorizer']['claims'].get('custom:role', 'user')
        if user_role != 'admin':
            return {
                'statusCode': 403,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unauthorized'})
            }
        
        # Procesar parámetros
        ticket_id = int(event['pathParameters']['id'])
        body = json.loads(event['body'])
        resolved_by = event['requestContext']['authorizer']['claims']['cognito:username']
        
        # Actualizar estado
        response = update_ticket_status(
            ticket_id, 
            body['status'],
            resolved_by
        )
        
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(response)
        }
        
    except Exception as e:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': str(e)})
        }