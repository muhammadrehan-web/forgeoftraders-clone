(function () {
  if (document.getElementById("yourgpt-chatbot") || window.$yourgptChatbot) return;
  window.YGC_WIDGET_ID = "c8844fe4-0c66-413c-9fa0-8029c7ca35d2";
  var script = document.createElement("script");
  script.id = "yourgpt-chatbot";
  script.src = "https://widget.yourgpt.ai/script.js";
  script.async = true;
  script.dataset.widget = window.YGC_WIDGET_ID;
  document.body.appendChild(script);
})();
