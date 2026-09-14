/* logic-coloc 免耦合适配器：主体项目只派发 CustomEvent 即可触发桌宠。 */
(function (global) {
  "use strict";
  global.connectLogicColocPet = function (options) {
    if (!global.HeisongkeDesktopPet) throw new Error("请先加载 pet-runtime.js");
    const pet = global.HeisongkeDesktopPet.create(options || {});
    const onEvent = (event) => {
      const detail = event.detail || {};
      if (detail.action) pet.trigger(detail.action, detail);
      else if (detail.event) pet.emit(detail.event, detail);
    };
    global.addEventListener("logic-coloc:pet", onEvent);
    const destroy = pet.destroy;
    pet.destroy = function () { global.removeEventListener("logic-coloc:pet", onEvent); destroy(); };
    return pet;
  };
})(window);
