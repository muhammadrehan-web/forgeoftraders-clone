(function () {
  fetch("/api/auth/me", { credentials: "same-origin" })
    .then(function (response) { return response.json(); })
    .then(function (data) {
      if (!data || data.role !== "admin") return;
      var menu = document.querySelector(".menu-inner");
      if (!menu || document.getElementById("admin-portal-link")) return;
      var item = document.createElement("li");
      item.className = "menu-item";
      item.id = "admin-portal-link";
      item.innerHTML = '<a class="menu-link" href="/admin"><i class="menu-icon mdi mdi-shield-account"></i><span>Admin</span></a>';
      menu.insertBefore(item, menu.firstChild);
    })
    .catch(function () {});
})();
