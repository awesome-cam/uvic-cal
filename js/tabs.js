const tabButtons =
    document.querySelectorAll(
        '.tab-button'
    );

const tabContents = {

    'course-search':
        document.getElementById(
            'course-search-tab'
        ),

    'schedule-builder':
        document.getElementById(
            'schedule-builder-tab'
        ),

    'help':
        document.getElementById(
            'help-tab'
        )
};

for (const button of tabButtons) {

    button.addEventListener(
        'click',
        () => {

            for (const btn of tabButtons) {

                btn.classList.remove(
                    'active'
                );
            }

            for (const content of Object.values(tabContents)) {

                content.classList.remove(
                    'active'
                );
            }

            button.classList.add(
                'active'
            );

            const tabName =
                button.dataset.tab;

            tabContents[
                tabName
            ].classList.add(
                'active'
            );
        }
    );
}
