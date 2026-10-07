(() => {
    'use strict';
    const text = (tag, value, className = '') => {
        const node = document.createElement(tag);
        node.textContent = value;
        node.className = className;
        return node;
    };
    let activeDialog;
    const cache = new Map();

    window.CourseDetails = {
        async open(course, trigger, renderActions, renderReviews, renderFacts) {
            activeDialog?.close();
            const dialog = document.createElement('dialog');
            dialog.className = 'course-detail-dialog';
            dialog.setAttribute('aria-labelledby', 'course-detail-title');
            const controller = new AbortController();
            let restoreFocus = true;
            const previousOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            const header = text('header', '', 'course-detail-header');
            const heading = text('div', '', 'course-detail-heading');
            heading.appendChild(text('p', `${course.semester} · ${course.selCode || ''}`, 'course-detail-eyebrow'));
            const title = text('h2', course.course); title.id = 'course-detail-title';
            heading.appendChild(title);
            heading.appendChild(text('p', [course.teacher, course.credits != null ? `${course.credits} ${t('outline-credits')}` : ''].filter(Boolean).join(' · '), 'course-detail-meta'));
            const close = text('button', '×', 'course-detail-close');
            close.type = 'button'; close.setAttribute('aria-label', t('outline-close'));
            close.addEventListener('click', () => dialog.close());
            header.append(heading, close);

            const tabs = text('div', '', 'course-detail-tabs');
            tabs.setAttribute('role', 'tablist');
            tabs.setAttribute('aria-label', t('outline-details'));
            const body = text('div', '', 'course-detail-body');
            const panels = ['overview', 'grading', 'original', 'reviews'].map((key, index) => {
                const tab = text('button', t(`outline-tab-${key}`));
                tab.type = 'button'; tab.id = `outline-tab-${key}`;
                tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', `outline-panel-${key}`);
                const panel = text('section', '', 'course-detail-panel');
                panel.id = `outline-panel-${key}`;
                panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', tab.id);
                panel.tabIndex = 0;
                const activate = () => {
                    tabs.querySelectorAll('button').forEach((button, i) => {
                        button.setAttribute('aria-selected', String(i === index));
                        button.tabIndex = i === index ? 0 : -1;
                    });
                    [...body.children].forEach((element, i) => { element.hidden = i !== index; });
                };
                tab.addEventListener('click', activate);
                tab.addEventListener('keydown', event => {
                    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
                    event.preventDefault();
                    const buttons = [...tabs.children];
                    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 3
                        : (index + (event.key === 'ArrowRight' ? 1 : -1) + 4) % 4;
                    buttons[next].click(); buttons[next].focus();
                });
                tab.setAttribute('aria-selected', String(index === 0)); tab.tabIndex = index === 0 ? 0 : -1;
                panel.hidden = index !== 0;
                tabs.appendChild(tab); body.appendChild(panel);
                return panel;
            });
            const [overview, grading, original, reviews] = panels;
            const reviewsNode = renderReviews?.();
            reviews.appendChild(reviewsNode || text('p', t('outline-reviews-empty'), 'course-detail-muted'));
            const footer = text('footer', '', 'course-detail-footer');
            const actions = renderActions?.();
            if (actions?.node) footer.appendChild(actions.node);
            footer.addEventListener('click', event => {
                if (event.target.closest('[data-close-course-details]')) { restoreFocus = false; dialog.close(); }
            }, {capture:true});
            dialog.append(header, tabs, body, footer);
            document.body.appendChild(dialog);
            activeDialog = dialog;
            dialog.addEventListener('click', event => {
                if (event.target !== dialog) return;
                const rect = dialog.getBoundingClientRect();
                if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
            });
            dialog.addEventListener('close', () => {
                controller.abort(); actions?.cleanup?.(); dialog.remove();
                document.body.style.overflow = previousOverflow;
                if (activeDialog === dialog) activeDialog = undefined;
                if (restoreFocus && trigger?.isConnected) trigger.focus();
            }, {once:true});
            dialog.showModal(); close.focus();

            function officialLink() {
                const link = text('a', `${t('outline-source')} ↗`, 'course-detail-source');
                const params = new URLSearchParams({lang:'cht',courseid:course.semester.replace('-','') + course.selCode});
                link.href = `https://coursesearch02.fcu.edu.tw/CourseOutline.aspx?${params}`;
                link.target = '_blank'; link.rel = 'noopener noreferrer';
                return link;
            }
            function section(panel, heading, values) {
                if (!values?.length) return;
                panel.appendChild(text('h3', heading));
                const list = document.createElement('ul');
                values.forEach(value => list.appendChild(text('li', value)));
                panel.appendChild(list);
            }
            async function load() {
                for (const panel of [overview, grading, original]) {
                    panel.replaceChildren(text('p', t('outline-loading'), 'course-detail-muted'));
                    panel.setAttribute('aria-busy', 'true');
                }
                const key = `${course.semester}|${course.selCode}`;
                try {
                    let data = cache.get(key);
                    if (!data) {
                        const params = new URLSearchParams({semester:course.semester,selCode:course.selCode});
                        const response = await fetch(`${window.API_BASE_URL || ''}/api/course-outline?${params}`, {signal:controller.signal});
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        data = await response.json();
                        cache.set(key, data);
                    }
                    if (!dialog.open) return;
                    for (const panel of [overview,grading,original]) panel.replaceChildren();
                    const facts = renderFacts?.();
                    if (facts) overview.appendChild(facts);
                    const ai = data.ai;
                    if (ai?.summary) {
                        overview.appendChild(text('span', t('outline-ai-label'), 'course-detail-ai-label'));
                        overview.appendChild(text('p', ai.summary, 'course-detail-summary'));
                        section(overview,t('outline-learn'),ai.learn);
                        if (!ai.learn?.length) overview.appendChild(text('p',t('outline-ai-scope-empty'),'course-detail-muted'));
                        overview.appendChild(text('p', t('outline-ai-note'), 'course-detail-muted'));
                    } else {
                        overview.appendChild(text('p', t('outline-ai-pending'), 'course-detail-muted'));
                        if (data.description) overview.appendChild(text('p',data.description.slice(0,360)+(data.description.length>360?'…':''),'course-detail-summary'));
                        section(overview,t('outline-learn'),data.objectives?.slice(0,5));
                        section(overview,t('outline-topics'),data.topics?.slice(0,5));
                        const readFull = text('button',t('outline-read-full'),'course-detail-retry');
                        readFull.type='button';
                        readFull.addEventListener('click',()=>{
                            const originalTab=tabs.querySelector('#outline-tab-original');
                            originalTab.click();originalTab.focus();body.scrollTop=0;
                        });
                        overview.appendChild(readFull);
                        if (!data.description && !data.objectives?.length && !data.topics?.length) overview.appendChild(text('p',t('outline-learning-empty'),'course-detail-muted'));
                    }
                    const rules = Array.isArray(data.gradeRules) ? data.gradeRules : [];
                    grading.appendChild(text('p',t('outline-grades-note'),'course-detail-muted'));
                    if (!rules.length && !data.gradingNote) grading.appendChild(text('p',t('grading-empty'),'course-detail-muted'));
                    let total = 0;
                    for (const rule of rules) {
                        if (!rule.name || !Number.isFinite(rule.percentage) || rule.percentage < 0 || rule.percentage > 100) continue;
                        total += rule.percentage;
                        const row = text('div','','course-detail-grade');
                        const label = text('div','','course-detail-grade-label');
                        label.append(text('span',rule.name),text('strong',`${rule.percentage}%`));
                        const bar = text('div','','course-detail-grade-track');
                        const fill = text('span','','course-detail-grade-fill');
                        fill.style.width = `${rule.percentage}%`; bar.appendChild(fill);
                        row.append(label,bar); grading.appendChild(row);
                        if (rule.note) grading.appendChild(text('p',rule.note,'course-detail-muted'));
                    }
                    if (data.gradingNote) grading.appendChild(text('p',data.gradingNote));
                    if (rules.length && Math.abs(total - 100) > 0.01) grading.appendChild(text('p',t('outline-grade-incomplete'),'course-detail-muted'));
                    if (data.description) { original.appendChild(text('h3',t('outline-description'))); original.appendChild(text('p',data.description)); }
                    section(original,t('outline-objectives'),data.objectives);
                    section(original,t('outline-topics'),data.topics);
                    section(original,t('outline-materials'),data.textbooks);
                    if (course.officialNote) { original.appendChild(text('h3',t('official-note'))); original.appendChild(text('p',course.officialNote)); }
                    if (data.fetchedAt) original.appendChild(text('p',`${t('outline-updated')} ${new Date(data.fetchedAt).toLocaleDateString()}`,'course-detail-muted'));
                    for (const panel of [overview, grading, original]) panel.appendChild(officialLink());
                } catch (error) {
                    if (controller.signal.aborted) return;
                    for (const panel of [overview,grading,original]) {
                        const message = text('p',t('outline-error'),'course-detail-muted'); message.setAttribute('role','status');
                        const retry = text('button',t('outline-retry'),'course-detail-retry');
                        retry.type='button'; retry.addEventListener('click',load);
                        panel.replaceChildren(message,retry,officialLink());
                    }
                    const facts = renderFacts?.();
                    if (facts) overview.prepend(facts);
                } finally {
                    for (const panel of [overview,grading,original]) panel.setAttribute('aria-busy','false');
                }
            }
            load();
        },
    };
})();
