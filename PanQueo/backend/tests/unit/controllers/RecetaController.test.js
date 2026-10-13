const RecetaController = require('../../../src/controllers/RecetaController');
const { Receta, RecetaIngrediente, Ingrediente } = require('../../../src/models');
const sequelize = require('../../../src/config/database');

jest.mock('../../../src/models', () => ({
  Receta: {
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  RecetaIngrediente: {
    bulkCreate: jest.fn(),
  },
  Ingrediente: {},
}));

jest.mock('../../../src/config/database', () => ({
  transaction: jest.fn(),
}));

describe('RecetaController - crear', () => {
  let mockTransaction;
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTransaction = {
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
    };

    sequelize.transaction.mockResolvedValue(mockTransaction);

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('Ruta exitosa (Happy Path)', () => {
    it('debe crear una receta con ingredientes exitosamente y retornar estado 201', async () => {
      const bodyData = {
        nombre_receta: 'Pan de Bono',
        descripcion: 'Pan tradicional',
        tiempo_preparacion: 30,
        ingredientes: [
          { id_ingrediente: 1, cantidad_requerida: 500 },
          { id_ingrediente: 2, cantidad_requerida: 200 },
        ],
      };

      req = { body: bodyData };

      const mockRecetaCreada = {
        id_receta: 10,
        nombre_receta: 'Pan de Bono',
        descripcion: 'Pan tradicional',
        tiempo_preparacion: 30,
      };

      const mockRecetaCompleta = {
        ...mockRecetaCreada,
        RecetaIngredientes: [
          { id_receta: 10, id_ingrediente: 1, cantidad_requerida: 500, Ingrediente: { nombre: 'Harina' } },
          { id_receta: 10, id_ingrediente: 2, cantidad_requerida: 200, Ingrediente: { nombre: 'Queso' } },
        ],
      };

      Receta.create.mockResolvedValue(mockRecetaCreada);
      RecetaIngrediente.bulkCreate.mockResolvedValue([]);
      Receta.findByPk.mockResolvedValue(mockRecetaCompleta);

      await RecetaController.crear(req, res);

      // Verificaciones
      expect(sequelize.transaction).toHaveBeenCalled();
      expect(Receta.create).toHaveBeenCalledWith(
        {
          nombre_receta: 'Pan de Bono',
          descripcion: 'Pan tradicional',
          tiempo_preparacion: 30,
        },
        { transaction: mockTransaction }
      );

      expect(RecetaIngrediente.bulkCreate).toHaveBeenCalledWith(
        [
          { id_receta: 10, id_ingrediente: 1, cantidad_requerida: 500 },
          { id_receta: 10, id_ingrediente: 2, cantidad_requerida: 200 },
        ],
        { transaction: mockTransaction }
      );

      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
      expect(mockTransaction.rollback).not.toHaveBeenCalled();

      expect(Receta.findByPk).toHaveBeenCalledWith(10, {
        include: [{ model: RecetaIngrediente, include: [{ model: Ingrediente }] }],
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockRecetaCompleta,
      });
    });

    it('debe crear una receta sin ingredientes cuando el arreglo de ingredientes está vacío ([])', async () => {
      const bodyData = {
        nombre_receta: 'Pan Baguette',
        descripcion: 'Sin ingredientes especificados',
        ingredientes: [],
      };

      req = { body: bodyData };

      const mockRecetaCreada = { id_receta: 11, nombre_receta: 'Pan Baguette' };
      const mockRecetaCompleta = { ...mockRecetaCreada, RecetaIngredientes: [] };

      Receta.create.mockResolvedValue(mockRecetaCreada);
      Receta.findByPk.mockResolvedValue(mockRecetaCompleta);

      await RecetaController.crear(req, res);

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(Receta.create).toHaveBeenCalledWith(
        { nombre_receta: 'Pan Baguette', descripcion: 'Sin ingredientes especificados' },
        { transaction: mockTransaction }
      );
      expect(RecetaIngrediente.bulkCreate).not.toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ status: 'success', data: mockRecetaCompleta });
    });

    it('debe crear una receta sin ingredientes cuando ingredientes es undefined en req.body', async () => {
      const bodyData = {
        nombre_receta: 'Pan Campesino',
      };

      req = { body: bodyData };

      const mockRecetaCreada = { id_receta: 12, nombre_receta: 'Pan Campesino' };
      const mockRecetaCompleta = { ...mockRecetaCreada, RecetaIngredientes: [] };

      Receta.create.mockResolvedValue(mockRecetaCreada);
      Receta.findByPk.mockResolvedValue(mockRecetaCompleta);

      await RecetaController.crear(req, res);

      expect(Receta.create).toHaveBeenCalledWith(
        { nombre_receta: 'Pan Campesino' },
        { transaction: mockTransaction }
      );
      expect(RecetaIngrediente.bulkCreate).not.toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ status: 'success', data: mockRecetaCompleta });
    });
  });

  describe('Casos de Error y Reversión (Rollback)', () => {
    it('debe revertir la transacción si falla Receta.create y retornar estado 500', async () => {
      req = {
        body: {
          nombre_receta: 'Pan Fallido',
          ingredientes: [{ id_ingrediente: 1, cantidad_requerida: 100 }],
        },
      };

      Receta.create.mockRejectedValue(new Error('Error de BD en creación'));

      await RecetaController.crear(req, res);

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(Receta.create).toHaveBeenCalled();
      expect(RecetaIngrediente.bulkCreate).not.toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error al crear receta',
      });
    });

    it('debe revertir la transacción si falla RecetaIngrediente.bulkCreate y retornar estado 500', async () => {
      req = {
        body: {
          nombre_receta: 'Pan con Error en Ingredientes',
          ingredientes: [{ id_ingrediente: 999, cantidad_requerida: 100 }],
        },
      };

      const mockRecetaCreada = { id_receta: 13, nombre_receta: 'Pan con Error en Ingredientes' };
      Receta.create.mockResolvedValue(mockRecetaCreada);
      RecetaIngrediente.bulkCreate.mockRejectedValue(new Error('Error FK en bulkCreate'));

      await RecetaController.crear(req, res);

      expect(sequelize.transaction).toHaveBeenCalled();
      expect(Receta.create).toHaveBeenCalled();
      expect(RecetaIngrediente.bulkCreate).toHaveBeenCalledWith(
        [{ id_receta: 13, id_ingrediente: 999, cantidad_requerida: 100 }],
        { transaction: mockTransaction }
      );
      expect(mockTransaction.commit).not.toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error al crear receta',
      });
    });
  });
});
