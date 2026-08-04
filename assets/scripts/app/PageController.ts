/**
 * 页面控制器只持有页面自身状态。
 * 未在页面类中声明的属性和方法会转发给 App 提供的共享资源、路由与 UI 工具。
 */
export abstract class PageController {
  [key: string]: any;

  constructor(protected readonly app: any) {
    return new Proxy(this, {
      get: (target, property, receiver) => {
        if (property in target) {
          return Reflect.get(target, property, receiver);
        }
        const value = app[property];
        return typeof value === 'function' ? value.bind(app) : value;
      },
      set: (target, property, value, receiver) => {
        // 页面新声明的字段必须留在页面实例上；只有 App 已声明的共享状态才转发。
        // 否则多个页面的 levels、backgroundColor 等同名字段会互相覆盖。
        if (property in target || !(property in app)) {
          return Reflect.set(target, property, value, receiver);
        }
        app[property] = value;
        return true;
      },
    });
  }
}
