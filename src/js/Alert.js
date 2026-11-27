export default class Alert {
  constructor(path = "/json/alerts.json") {
    this.path = path;
  }

  async getAlerts() {
    try {
      const response = await fetch(this.path);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      // no alerts file (or invalid JSON) -> simply show no alerts
      return [];
    }
  }

  async init() {
    const alerts = await this.getAlerts();
    if (alerts.length === 0) return;

    const section = document.createElement("section");
    section.classList.add("alert-list");

    alerts.forEach((alert) => {
      const p = document.createElement("p");
      p.textContent = alert.message;
      p.style.backgroundColor = alert.background;
      p.style.color = alert.color;
      p.style.margin = "0";
      p.style.padding = "0.75rem 1rem";
      p.style.textAlign = "center";
      p.style.fontWeight = "bold";
      section.appendChild(p);
    });

    document.querySelector("main").prepend(section);
  }
}
