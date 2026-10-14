(() => {
    const form = document.getElementById("suggestionForm");
    const submitButton = document.getElementById("suggestionSubmit");
    const status = document.getElementById("suggestionStatus");
    const themeButton = document.getElementById("themeButton");

    // Add the Formspree form URL here after creating the form.
    const formspreeEndpoint = "";

    function getFormspreeEndpoint(endpoint) {
        if (!endpoint) {
            return "";
        }

        try {
            const url = new URL(endpoint);

            if (
                url.protocol !== "https:" ||
                url.hostname !== "formspree.io" ||
                !/^\/f\/[A-Za-z0-9]+$/.test(url.pathname)
            ) {
                return "";
            }

            return url.href;
        } catch (error) {
            return "";
        }
    }

    const endpoint = getFormspreeEndpoint(formspreeEndpoint);

    if (endpoint) {
        submitButton.disabled = false;
        status.textContent = "";
    } else if (formspreeEndpoint) {
        status.textContent = "Formspree endpoint 格式無效，請檢查設定。";
        status.classList.add("is-error");
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (!endpoint) {
            status.textContent = "回報服務尚未設定，目前無法送出。";
            status.classList.add("is-error");
            return;
        }

        submitButton.disabled = true;
        status.classList.remove("is-error");
        status.textContent = "正在送出…";

        try {
            const formData = new FormData(form);
            const title = formData.get("title");
            const type = formData.get("type");
            formData.set("_subject", `[${type}] ${title}`);

            const response = await fetch(endpoint, {
                method: "POST",
                body: formData,
                headers: {
                    Accept: "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`Formspree 回應錯誤（${response.status}）。`);
            }

            form.reset();
            status.textContent = "已送出，謝謝你的回報！";
        } catch (error) {
            console.error("Mini Arcade：回報表單送出失敗。", error);
            status.textContent = "送出失敗，請檢查網路連線後再試一次。";
            status.classList.add("is-error");
        } finally {
            submitButton.disabled = false;
        }
    });

    if (themeButton) {
        const savedTheme =
            window.MiniArcadeStorage.getSetting("miniArcade_theme");
        const initialTheme =
            savedTheme === "dark" || savedTheme === "light"
                ? savedTheme
                : window.matchMedia("(prefers-color-scheme: dark)").matches
                    ? "dark"
                    : "light";

        function applyTheme(theme, persist = false) {
            document.documentElement.dataset.theme = theme;
            themeButton.textContent = theme === "dark" ? "☀" : "◐";
            themeButton.setAttribute(
                "aria-label",
                theme === "dark" ? "切換為淺色模式" : "切換為深色模式"
            );

            if (persist) {
                window.MiniArcadeStorage.setSetting(
                    "miniArcade_theme",
                    theme
                );
            }
        }

        applyTheme(initialTheme);
        themeButton.addEventListener("click", () => {
            const nextTheme =
                document.documentElement.dataset.theme === "dark"
                    ? "light"
                    : "dark";
            applyTheme(nextTheme, true);
        });
    }
})();
