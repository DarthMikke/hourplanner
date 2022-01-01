#-*- coding: utf-8 -*-

"""
Convenience library for sending certain HTTP responses with JSON payload.
"""

from django.http import JsonResponse

#class Responses:
def error(status, msg=None, data=None):
    standard_msg = {
        400: 'Your request contains an error',
        401: 'Not authenticated',
        403: 'Forbidden',
        404: 'Item has not been found',
        500: 'An error has occured',
        501: 'This action is not yet implemented',
    }

    if msg is None:
        if status in standard_msg.keys():
            msg = standard_msg[status]
        else:
            if 400 <= status and status <= 599:
                msg = "An error has occured"

    body = {'error': msg}
    if data is not None:
        body['data'] = data

    return JsonResponse(body, status=status)

def bad_request(msg=None, data=None):
    return error(400, msg, data)

def unauthorized(msg=None, data=None):
    return error(401, msg, data)

def forbidden(msg=None, data=None):
    return error(403, msg, data)

def not_found(msg=None, data=None):
    return error(404, msg, data)

def not_implemented(msg=None, data=None):
    return error(501, msg, data)
