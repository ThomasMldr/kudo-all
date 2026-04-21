function getContainer() {
    let container =  document.querySelector(".feed-header");

    if (container) {
        container.style.display = "flex";
        container.style.justifyContent = "space-between";
    } else {
        let stravaContainer = document.querySelector(".feed-ui");

        if (null === stravaContainer) {
            stravaContainer = document.querySelector(".feature-feed")
        }

        if (null === stravaContainer) {
            return null;
        }

        container = stravaContainer.parentElement.querySelector('form');
        container.style.justifyContent = "space-between";
        container.style.maxWidth = "100%";

        const el = document.createElement("div");
        el.classList.add("feed-header");
        el.style.height = "40px";
        container.append(el);
        el.style.display = "flex";
        el.style.justifyContent = "end";
    }

    return document.querySelector(".feed-header");
}

function getClubContainer() {
    const tabs = document.querySelector('div.spans11 ul.tabs');
    if (!tabs) return null;

    const li = document.createElement('li');
    li.classList.add('right');
    li.style.borderTop = '2px solid #dfdfe8';
    tabs.appendChild(li);

    return li;
}

function createButton() {
    const label = "Kudo All";

    const navItem = document.createElement("div");
    navItem.style.display = "flex";

    const style = `
    margin-top: 0;
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    max-width: 200px;
    float: right;
`;

    navItem.innerHTML = `
    <button type="button" class="btn btn-default btn-sm empty" style="${style}">
        <div class="app-icon icon-kudo" style="margin-right: 10px;">${label}</div>
        <div class="ka-progress text-caption1">${label}</div>
    </button>
    `;

    navItem.addEventListener("click", kudoAllHandler);

    return navItem;
}

function createTabButton() {
    const tab = document.createElement('a');
    tab.classList.add('tab');
    tab.style.cssText = 'background-color: #fff; border-left-color: #dfdfe8; border-right-color: #dfdfe8; padding-bottom: 10px; cursor: pointer;';
    tab.innerHTML = '<span class="app-icon icon-kudo" style="display:inline-block;float:none;margin:0 6px 0 0;vertical-align:middle;height:14px;width:14px;"></span>Kudo All';
    tab.addEventListener('click', kudoAllHandler);
    return tab;
}

function kudoAllHandler(event) {
    event.preventDefault();

    const athleteId = getCurrentAthleteId();

    Array.from(document.querySelectorAll("[data-testid='web-feed-entry']")).forEach((entry) => {
        Array.from(entry.querySelectorAll("[data-testid='entry-header']")).forEach((entryHeader) => {
            const activity = entryHeader.parentElement;

            if (!activity) {
                return;
            }

            Array.from(activity.querySelectorAll("a[data-testid='owners-name']")).forEach((link) => {
                let feedAthleteId = -1;

                if (link?.href) {
                    feedAthleteId = Number.parseInt(link.href.split("/").pop(), 10);
                }

                // My own activities
                if (athleteId !== null && feedAthleteId === athleteId) {
                    return;
                }

                const btn = activity.querySelector("[data-testid='kudos_button']");

                if (!btn) {
                    return;
                }

                const svg = btn.querySelector("svg[data-testid='unfilled_kudos']");

                if (!svg) {
                    return;
                }

                btn.click();
            });
        });
    });
}

function getCurrentAthleteId() { //find athelete id from multiple possible places on various strava pages
    const scriptPattern = /\bathlete_id\s*:\s*['"]?(\d+)|\bvar athleteId\s*=\s*(\d+)/;
    for (const script of document.querySelectorAll('script:not([src])')) {
        const match = script.textContent.match(scriptPattern);
        if (match) return Number.parseInt(match[1] || match[2], 10);
    }

    const trainingLink = document.querySelector('a[href*="/athletes/"][href*="/training"]');
    if (trainingLink) {
        const match = trainingLink.href.match(/\/athletes\/(\d+)/);
        if (match) return Number.parseInt(match[1], 10);
    }

    const profileLink = Array.from(document.querySelectorAll('a[href*="/athletes/"]'))
        .find(l => l.textContent.trim() === 'My Profile');
    if (profileLink) {
        const match = profileLink.href.match(/\/athletes\/(\d+)/);
        if (match) return Number.parseInt(match[1], 10);
    }

    const avatarLink = document.querySelector("a[data-testid='avatar-wrapper']");
    if (avatarLink?.href) {
        const id = Number.parseInt(avatarLink.href.split('/').pop(), 10);
        if (!Number.isNaN(id)) return id;
    }

    return null;
}

function isClubFeed() {
    return /\/clubs\/\d+\/recent_activity/.test(window.location.pathname);
}

setTimeout(() => {
    if (isClubFeed()) {
        const container = getClubContainer();
        if (container) {
            container.appendChild(createTabButton());
        }
    } else {
        const container = getContainer();
        if (container) {
            container.appendChild(createButton());
        }
    }
}, 1000);
