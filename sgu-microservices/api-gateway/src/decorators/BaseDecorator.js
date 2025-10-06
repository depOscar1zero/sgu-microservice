/**
 * Base Decorator para el API Gateway
 * Aplicando principios del Decorator Pattern
 */

class BaseDecorator {
  constructor(component) {
    if (!component) {
      throw new Error("BaseDecorator requires a component to decorate");
    }
    this._component = component;
  }

  /**
   * Método base que debe ser sobrescrito por decoradores específicos
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  handle(req, res, next) {
    return this._component.handle(req, res, next);
  }

  /**
   * Obtiene el componente decorado
   * @returns {Object} Componente decorado
   */
  getComponent() {
    return this._component;
  }

  /**
   * Obtiene el nombre del decorador
   * @returns {string} Nombre del decorador
   */
  getName() {
    return this.constructor.name;
  }

  /**
   * Verifica si el decorador tiene un componente específico
   * @param {string} componentName - Nombre del componente
   * @returns {boolean} True si tiene el componente
   */
  hasComponent(componentName) {
    if (this._component && this._component.getName) {
      return this._component.getName() === componentName;
    }
    return false;
  }

  /**
   * Obtiene la cadena de decoradores
   * @returns {string[]} Array de nombres de decoradores
   */
  getDecoratorChain() {
    const chain = [this.getName()];
    if (this._component && this._component.getDecoratorChain) {
      chain.push(...this._component.getDecoratorChain());
    }
    return chain;
  }
}

module.exports = BaseDecorator;
