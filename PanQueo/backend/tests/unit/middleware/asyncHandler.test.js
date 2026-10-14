const asyncHandler = require('../../../src/middleware/asyncHandler');

describe('asyncHandler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false,
    };
    next = jest.fn();
  });

  it('should call the wrapped handler successfully', async () => {
    const handler = jest.fn().mockResolvedValue('success');
    const wrapped = asyncHandler(handler);

    await wrapped(req, res, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should catch rejected promise and send status 500 with default message', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('Something failed'));
    const wrapped = asyncHandler(handler, 'Error en operacion');

    await wrapped(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Error en operacion',
    });
  });

  it('should respect custom error status and custom message if set on error', async () => {
    const customError = new Error('Bad Request');
    customError.status = 400;
    customError.customMessage = 'Datos invalidos';

    const handler = jest.fn().mockRejectedValue(customError);
    const wrapped = asyncHandler(handler, 'Default message');

    await wrapped(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Datos invalidos',
    });
  });

  it('should call next(error) if headers are already sent', async () => {
    res.headersSent = true;
    const error = new Error('Failure after headers sent');
    const handler = jest.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(handler);

    await wrapped(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});
