/**
 * Tests para el Value Object: Money
 * Aplicando principios de Domain-Driven Design (DDD)
 */

const { describe, test, expect } = require('@jest/globals');
const Money = require('../../../src/domain/value-objects/Money');

describe('Value Object: Money', () => {
  describe('Creación de Money', () => {
    test('debe crear una cantidad de dinero válida', () => {
      const money = new Money(100.5, 'USD');

      expect(money.amount).toBe(100.5);
      expect(money.currency).toBe('USD');
    });

    test('debe usar USD como moneda por defecto', () => {
      const money = new Money(100.5);

      expect(money.currency).toBe('USD');
    });

    test('debe redondear a 2 decimales', () => {
      const money = new Money(100.555);

      expect(money.amount).toBe(100.56);
    });

    test('debe lanzar error para cantidad negativa', () => {
      expect(() => {
        new Money(-100);
      }).toThrow('Amount no puede ser negativo');
    });

    test('debe lanzar error para cantidad NaN', () => {
      expect(() => {
        new Money(NaN);
      }).toThrow('Amount no puede ser NaN');
    });

    test('debe lanzar error para moneda vacía', () => {
      expect(() => {
        new Money(100, '');
      }).toThrow('Currency no puede ser una cadena vacía');
    });

    test('debe convertir moneda a mayúsculas', () => {
      const money = new Money(100, 'usd');

      expect(money.currency).toBe('USD');
    });
  });

  describe('Operaciones aritméticas', () => {
    let money1, money2;

    beforeEach(() => {
      money1 = new Money(100.5, 'USD');
      money2 = new Money(50.25, 'USD');
    });

    describe('add()', () => {
      test('debe sumar dos cantidades de la misma moneda', () => {
        const result = money1.add(money2);

        expect(result.amount).toBe(150.75);
        expect(result.currency).toBe('USD');
      });

      test('debe lanzar error al sumar monedas diferentes', () => {
        const moneyEUR = new Money(50, 'EUR');

        expect(() => {
          money1.add(moneyEUR);
        }).toThrow('No se pueden sumar cantidades de diferentes monedas');
      });

      test('debe lanzar error al sumar con objeto no Money', () => {
        expect(() => {
          money1.add(50);
        }).toThrow('Solo se pueden sumar objetos Money');
      });
    });

    describe('subtract()', () => {
      test('debe restar dos cantidades de la misma moneda', () => {
        const result = money1.subtract(money2);

        expect(result.amount).toBe(50.25);
        expect(result.currency).toBe('USD');
      });

      test('debe lanzar error si el resultado es negativo', () => {
        expect(() => {
          money2.subtract(money1);
        }).toThrow('El resultado no puede ser negativo');
      });

      test('debe lanzar error al restar monedas diferentes', () => {
        const moneyEUR = new Money(50, 'EUR');

        expect(() => {
          money1.subtract(moneyEUR);
        }).toThrow('No se pueden restar cantidades de diferentes monedas');
      });
    });

    describe('multiply()', () => {
      test('debe multiplicar por un factor válido', () => {
        const result = money1.multiply(2);

        expect(result.amount).toBe(201.0);
        expect(result.currency).toBe('USD');
      });

      test('debe lanzar error para factor negativo', () => {
        expect(() => {
          money1.multiply(-1);
        }).toThrow('Factor no puede ser negativo');
      });

      test('debe lanzar error para factor no numérico', () => {
        expect(() => {
          money1.multiply('2');
        }).toThrow('Factor debe ser un número');
      });
    });
  });

  describe('Comparaciones', () => {
    let money1, money2, money3;

    beforeEach(() => {
      money1 = new Money(100.5, 'USD');
      money2 = new Money(100.5, 'USD');
      money3 = new Money(150.75, 'USD');
    });

    describe('equals()', () => {
      test('debe retornar true para cantidades iguales', () => {
        expect(money1.equals(money2)).toBe(true);
      });

      test('debe retornar false para cantidades diferentes', () => {
        expect(money1.equals(money3)).toBe(false);
      });

      test('debe retornar false para objetos no Money', () => {
        expect(money1.equals(100.5)).toBe(false);
      });
    });

    describe('isGreaterThan()', () => {
      test('debe retornar true si es mayor', () => {
        expect(money3.isGreaterThan(money1)).toBe(true);
      });

      test('debe retornar false si es menor o igual', () => {
        expect(money1.isGreaterThan(money3)).toBe(false);
        expect(money1.isGreaterThan(money2)).toBe(false);
      });

      test('debe lanzar error para monedas diferentes', () => {
        const moneyEUR = new Money(100, 'EUR');

        expect(() => {
          money1.isGreaterThan(moneyEUR);
        }).toThrow('No se pueden comparar cantidades de diferentes monedas');
      });
    });

    describe('isLessThan()', () => {
      test('debe retornar true si es menor', () => {
        expect(money1.isLessThan(money3)).toBe(true);
      });

      test('debe retornar false si es mayor o igual', () => {
        expect(money3.isLessThan(money1)).toBe(false);
        expect(money1.isLessThan(money2)).toBe(false);
      });
    });

    describe('isZero()', () => {
      test('debe retornar true para cantidad cero', () => {
        const zeroMoney = new Money(0, 'USD');

        expect(zeroMoney.isZero()).toBe(true);
      });

      test('debe retornar false para cantidad no cero', () => {
        expect(money1.isZero()).toBe(false);
      });
    });
  });

  describe('Métodos estáticos', () => {
    describe('create()', () => {
      test('debe crear una cantidad de dinero', () => {
        const money = Money.create(100.5, 'USD');

        expect(money.amount).toBe(100.5);
        expect(money.currency).toBe('USD');
      });
    });

    describe('zero()', () => {
      test('debe crear una cantidad de dinero en cero', () => {
        const zeroMoney = Money.zero('USD');

        expect(zeroMoney.amount).toBe(0);
        expect(zeroMoney.currency).toBe('USD');
      });

      test('debe usar USD como moneda por defecto', () => {
        const zeroMoney = Money.zero();

        expect(zeroMoney.currency).toBe('USD');
      });
    });

    describe('isValid()', () => {
      test('debe retornar true para datos válidos', () => {
        expect(Money.isValid(100.5, 'USD')).toBe(true);
      });

      test('debe retornar false para datos inválidos', () => {
        expect(Money.isValid(-100, 'USD')).toBe(false);
        expect(Money.isValid(100, '')).toBe(false);
        expect(Money.isValid(NaN, 'USD')).toBe(false);
      });
    });
  });

  describe('toString()', () => {
    test('debe retornar representación en string', () => {
      const money = new Money(100.5, 'USD');

      expect(money.toString()).toBe('100.5 USD');
    });
  });
});
