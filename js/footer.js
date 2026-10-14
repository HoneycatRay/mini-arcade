(() => {
    const footer = document.getElementById("siteFooter");

    if (!footer) {
        return;
    }

    footer.setAttribute("role", "contentinfo");
    footer.setAttribute("aria-label", "頁尾");
    footer.innerHTML = `
        <div class="site-footer__main">
            <div class="site-footer__container">
                <nav class="footer-nav" aria-label="頁尾導覽">
                    <section class="footer-col">
                        <h2 class="footer-col__title">
                            <button class="footer-col__toggle" type="button" aria-expanded="true" aria-controls="footer-links-visit">
                                <span>前往</span>
                                <span class="footer-col__chevron" aria-hidden="true"></span>
                            </button>
                        </h2>
                        <ul class="footer-col__list" id="footer-links-visit">
                            <li><a href="https://sites.google.com/view/honeycatray">個人網站</a></li>
                            <li><a href="suggestion.html">建議</a></li>
                        </ul>
                    </section>
                    <section class="footer-col">
                        <h2 class="footer-col__title">
                            <button class="footer-col__toggle" type="button" aria-expanded="true" aria-controls="footer-links-about">
                                <span>關於</span>
                                <span class="footer-col__chevron" aria-hidden="true"></span>
                            </button>
                        </h2>
                        <ul class="footer-col__list" id="footer-links-about">
                            <li><a href="https://sites.google.com/view/honeycatray/program/mini-arcade">專案介紹</a></li>
                            <li><a href="https://github.com/HoneycatRay/mini-arcade">本專案 GitHub</a></li>
                        </ul>
                    </section>
                </nav>
            </div>
        </div>
        <div class="site-footer__bottom">
            <div class="site-footer__container site-footer__bottom-inner">
                <p class="footer-copyright">Copyright © 2026 Ray Wang. 版權所有 All Rights Reserved</p>
                <a
                    class="footer-social__link"
                    href="https://github.com/HoneycatRay"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    title="GitHub"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 .5C5.37.5 0 5.78 0 12.292c0 5.211 3.438 9.63 8.205 11.188.6.111.82-.254.82-.567 0-.28-.01-1.022-.015-2.005-3.338.711-4.042-1.582-4.042-1.582-.546-1.361-1.335-1.725-1.335-1.725-1.087-.731.084-.716.084-.716 1.205.082 1.838 1.215 1.838 1.215 1.07 1.803 2.809 1.282 3.495.981.108-.763.417-1.282.76-1.577-2.665-.295-5.466-1.309-5.466-5.827 0-1.287.465-2.339 1.235-3.164-.135-.298-.54-1.497.105-3.121 0 0 1.005-.316 3.3 1.209.96-.262 1.98-.392 3-.398 1.02.006 2.04.136 3 .398 2.28-1.525 3.285-1.209 3.285-1.209.645 1.624.24 2.823.12 3.121.765.825 1.23 1.877 1.23 3.164 0 4.53-2.805 5.527-5.475 5.817.42.354.81 1.077.81 2.17 0 1.565-.015 2.83-.015 3.213 0 .31.21.681.83.564C20.565 21.917 24 17.5 24 12.292 24 5.78 18.627.5 12 .5z"></path>
                    </svg>
                </a>
            </div>
        </div>
    `;

    const mobileLayout = window.matchMedia("(max-width: 560px)");
    const columns = Array.from(
        footer.querySelectorAll(".footer-col")
    );

    function updateColumns() {
        columns.forEach(column => {
            const button = column.querySelector(".footer-col__toggle");
            const panel = footer.querySelector(
                `#${button.getAttribute("aria-controls")}`
            );

            if (!mobileLayout.matches) {
                button.setAttribute("aria-expanded", "true");
                button.tabIndex = -1;
                panel.hidden = false;
                column.classList.add("is-open");
                return;
            }

            button.removeAttribute("tabindex");
            const isOpen = column.classList.contains("is-open");
            button.setAttribute("aria-expanded", String(isOpen));
            panel.hidden = !isOpen;
        });
    }

    columns.forEach(column => {
        const button = column.querySelector(".footer-col__toggle");

        button.addEventListener("click", () => {
            if (!mobileLayout.matches) {
                return;
            }

            const isOpen = column.classList.toggle("is-open");
            const panel = footer.querySelector(
                `#${button.getAttribute("aria-controls")}`
            );
            button.setAttribute("aria-expanded", String(isOpen));
            panel.hidden = !isOpen;
        });
    });

    updateColumns();

    if (typeof mobileLayout.addEventListener === "function") {
        mobileLayout.addEventListener("change", updateColumns);
    } else {
        mobileLayout.addListener(updateColumns);
    }
})();
