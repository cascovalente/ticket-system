import os
import boto3
from boto3.dynamodb.conditions import Key
from datetime import datetime

# Configuración basada en variables de entorno
APP_REGION = os.getenv("APP_REGION", "us-east-1")
TICKETS_TABLE_NAME = os.environ["TICKETS_TABLE"]  

# Cliente de DynamoDB
dynamodb = boto3.resource("dynamodb", region_name=APP_REGION)
TICKETS_TABLE = dynamodb.Table(TICKETS_TABLE_NAME)

def create_ticket(ticket_data: dict) -> dict:
    """Crea un nuevo ticket en DynamoDB."""
    try:
        response = TICKETS_TABLE.put_item(Item=ticket_data)
        return response
    except Exception as e:
        raise RuntimeError(f"Error creating ticket: {str(e)}") from e

def get_user_tickets(username: str) -> list:
    """Obtiene todos los tickets de un usuario específico."""
    try:
        response = TICKETS_TABLE.query(
            IndexName="createdBy-index",
            KeyConditionExpression=Key("createdBy").eq(username)
        )
        return response.get("Items", [])
    except Exception as e:
        raise RuntimeError(f"Error fetching user tickets: {str(e)}") from e

def get_all_tickets() -> list:
    """Obtiene todos los tickets (solo para administradores)."""
    try:
        response = TICKETS_TABLE.scan()
        return response.get("Items", [])
    except Exception as e:
        raise RuntimeError(f"Error fetching all tickets: {str(e)}") from e

def update_ticket_status(ticket_id: int, new_status: str, resolved_by: str = None) -> dict:
    """Actualiza el estado de un ticket."""
    try:
        update_expression = "SET #status = :status"
        expression_values = {":status": new_status}

        if new_status == "resolved":
            update_expression += ", resolvedAt = :resolvedAt, resolvedBy = :resolvedBy"
            expression_values[":resolvedAt"] = datetime.now().isoformat()
            expression_values[":resolvedBy"] = resolved_by

        response = TICKETS_TABLE.update_item(
            Key={"id": ticket_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues=expression_values,
            ReturnValues="UPDATED_NEW"
        )
        return response
    except Exception as e:
        raise RuntimeError(f"Error updating ticket status: {str(e)}") from e

def delete_ticket(ticket_id: int) -> dict:
    """Elimina un ticket (solo para administradores)."""
    try:
        response = TICKETS_TABLE.delete_item(
            Key={"id": ticket_id}
        )
        return response
    except Exception as e:
        raise RuntimeError(f"Error deleting ticket: {str(e)}") from e