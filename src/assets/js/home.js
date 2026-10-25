import "lite-youtube-embed";
import BasePage from "./base-page";
import Lightbox from "fslightbox";
window.fslightbox = Lightbox;

class Home extends BasePage {
    onReady() {
        this.initFeaturedTabs();
        this.initCampaignSlider();
    }

    initCampaignSlider() {
        const frame = document.querySelector('[data-noora-slider]');
        if (!frame) return;
        const slides = [...frame.querySelectorAll('[data-noora-slide]')];
        const dots = [...document.querySelectorAll('.nl-campaign__dot')];
        const previous = frame.querySelector('[data-noora-prev]');
        const next = frame.querySelector('[data-noora-next]');
        const dotGroup = document.querySelector('.nl-campaign__dots');
        if (slides.length < 2 || dots.length !== slides.length || !previous || !next || !dotGroup) return;

        let active = 0;
        let request = 0;
        let moving = false;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const updateControls = () => {
            previous.hidden = active === 0;
            next.hidden = active === slides.length - 1;
        };
        const show = async (index, requestedDirection = null) => {
            const target = index;
            if (target < 0 || target >= slides.length) return;
            if (moving || target === active) return;
            const currentRequest = ++request;
            const image = slides[target].querySelector('img');
            if (image && !image.complete) {
                image.loading = 'eager';
                try { await image.decode(); } catch { return; }
            }
            if (currentRequest !== request || (image && !image.naturalWidth)) return;

            const direction = requestedDirection || (target > active ? 'next' : 'previous');
            const documentDirection = document.documentElement.dir === 'rtl' ? -1 : 1;
            const motion = (direction === 'next' ? 1 : -1) * documentDirection;
            const currentSlide = slides[active];
            moving = true;
            frame.style.height = `${frame.getBoundingClientRect().height}px`;
            frame.classList.add('is-animating');
            currentSlide.classList.add('is-moving');
            slides[target].hidden = false;
            slides[target].classList.add('is-moving');

            if (!reducedMotion) {
                const easing = 'cubic-bezier(.22,.61,.36,1)';
                const duration = 480;
                const leave = currentSlide.animate([
                    { transform: 'translateX(0)', opacity: 1 },
                    { transform: `translateX(${-motion * 16}%)`, opacity: 0 },
                ], { duration, easing, fill: 'forwards' });
                const enter = slides[target].animate([
                    { transform: `translateX(${motion * 16}%)`, opacity: 0 },
                    { transform: 'translateX(0)', opacity: 1 },
                ], { duration, easing, fill: 'forwards' });
                await Promise.all([leave.finished, enter.finished]);
                leave.cancel();
                enter.cancel();
            }

            currentSlide.hidden = true;
            currentSlide.classList.remove('is-moving');
            slides[target].classList.remove('is-moving');
            frame.classList.remove('is-animating');
            frame.style.height = '';
            active = target;
            dots.forEach((dot, position) => { dot.setAttribute('aria-current', String(position === active)); });
            updateControls();
            moving = false;
        };

        previous.addEventListener('click', () => show(active - 1, 'previous'));
        next.addEventListener('click', () => show(active + 1, 'next'));
        dots.forEach((dot, position) => dot.addEventListener('click', () => show(position, position > active ? 'next' : 'previous')));
        updateControls();
        dotGroup.hidden = false;
    }

    /**
     * used in views/components/home/featured-products-style*.twig
     */
    initFeaturedTabs() {
        app.all('.tab-trigger', el => {
            el.addEventListener('click', ({ currentTarget: btn }) => {
                let id = btn.dataset.componentId;
                // btn.setAttribute('fill', 'solid');
                app.toggleClassIf(`#${id} .tabs-wrapper>div`, 'is-active opacity-0 translate-y-3', 'inactive', tab => tab.id == btn.dataset.target)
                    .toggleClassIf(`#${id} .tab-trigger`, 'is-active', 'inactive', tabBtn => tabBtn == btn);

                // fadeIn active tabe
                setTimeout(() => app.toggleClassIf(`#${id} .tabs-wrapper>div`, 'opacity-100 translate-y-0', 'opacity-0 translate-y-3', tab => tab.id == btn.dataset.target), 100);
            })
        });
        document.querySelectorAll('.s-block-tabs').forEach(block => block.classList.add('tabs-initialized'));
    }
}

Home.initiateWhenReady(['index']);
