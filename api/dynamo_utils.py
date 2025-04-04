import boto3
import os
from datetime import datetime
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb', region_name=os.environ['AWS_REGION'])
table = dynamodb.Table(os.environ['TICKETS_TABLE'])

def create_ticket(ticket_data):
    table.put_item(Item=ticket_data)

def get_user_tickets(username):
    response = table.query(
        IndexName='createdBy-index',
        KeyConditionExpression=Key('createdBy').eq(username)
    )
    return response.get('Items', [])

def get_all_tickets():
    response = table.scan()
    return response.get('Items', [])

def update_ticket_status(ticket_id, new_status, resolved_by=None):
    update_expr = 'SET #status = :status'
    expr_values = {':status': new_status}
    
    if new_status == 'resolved':
        update_expr += ', resolvedAt = :resolvedAt, resolvedBy = :resolvedBy'
        expr_values.update({
            ':resolvedAt': datetime.now().isoformat(),
            ':resolvedBy': resolved_by
        })
    
    return table.update_item(
        Key={'id': ticket_id},
        UpdateExpression=update_expr,
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues=expr_values,
        ReturnValues='UPDATED_NEW'
    )