(() => {
  'use strict';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const demo = document.querySelector('#browser-demo');
  const steps = [...document.querySelectorAll('[data-module]')];
  const fly = document.querySelector('.module-fly');
  const builder = document.querySelector('#builder .builder');
  const modules = { block: true, text: false, image: false, flex: false, grid: false, ui: false };
  let assemblyTimers = [];
  let assemblyVisible = false;
  let flight;
  const cancelAssembly = () => {
    assemblyTimers.forEach(clearTimeout);
    assemblyTimers = [];
    flight?.cancel();
    fly.style.opacity = '0';
    steps.forEach(step => step.classList.remove('arriving'));
    demo.querySelectorAll('*').forEach(el =>
      el.getAnimations().forEach(animation => animation.cancel()));
  };
  const render = () => {
    Object.entries(modules).forEach(([name, installed]) => { demo.dataset[name] = String(installed); });
    demo.dataset.inline = String(modules.text);
    steps.forEach(step => { step.dataset.active = String(modules[step.dataset.module]); });
  };
  const installModule = name => {
    const boxes = [...demo.querySelectorAll('.demo-nav,.demo-nav > img,.nav-items,.demo-banner,.skeleton-lines,.demo-banner > img,.demo-card,.demo-card > span,.inline-lines')];
    boxes.forEach(el => el.getAnimations().forEach(animation => animation.cancel()));
    const before = new Map(boxes.map(el => [el, el.getBoundingClientRect()]));
    modules[name] = true;
    render();
    const after = new Map(boxes.map(el => [el, el.getBoundingClientRect()]));
    const scale = builder.getBoundingClientRect().width / builder.offsetWidth || 1;
    if (['flex', 'grid', 'ui'].includes(name)) boxes.forEach(el => {
      const a = after.get(el);
      const b = before.get(el);
      if (!a.width || !a.height || !b.width || !b.height) return;
      let parent = el.parentElement;
      while (parent && !before.has(parent)) parent = parent.parentElement;
      let dx, dy, sx, sy;
      if (parent) {
        const pa = after.get(parent);
        const pb = before.get(parent);
        const px = pb.width / pa.width || 1;
        const py = pb.height / pa.height || 1;
        // Compensate for the parent's movement and scaling so nested content stays continuous.
        dx = ((b.left - pb.left) / px - (a.left - pa.left)) / scale;
        dy = ((b.top - pb.top) / py - (a.top - pa.top)) / scale;
        sx = b.width / (a.width * px);
        sy = b.height / (a.height * py);
      } else {
        dx = (b.left - a.left) / scale;
        dy = (b.top - a.top) / scale;
        sx = b.width / a.width;
        sy = b.height / a.height;
      }
      el.animate([
        { transformOrigin: 'top left', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        { transformOrigin: 'top left', transform: 'translate(0, 0) scale(1, 1)' }
      ], { duration: 850, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
    const installed = steps.find(step => step.dataset.module === name);
    installed.animate([{ transform: 'scale(1.16)' }, { transform: 'scale(1)' }],
      { duration: 280, easing: 'ease-out' });
    if (name === 'image') demo.querySelectorAll('.browser-content img,.window-icon,.lines-icon,.grid-icon').forEach(el =>
      el.animate([{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'scale(1)' }],
        { duration: 600, easing: 'ease-out' }));
    if (name === 'ui') demo.querySelectorAll('.chrome-ui,.browser-tabs').forEach(el =>
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, easing: 'ease-out' }));
    if (name === 'text') demo.querySelectorAll('.skeleton-lines,.inline-lines,.nav-items').forEach(el =>
      el.animate([{ opacity: 0 }, { opacity: 1 }],
        { duration: 650, easing: 'ease-out' }));
  };
  const sendModule = name => {
    const step = steps.find(el => el.dataset.module === name);
    const container = builder.getBoundingClientRect();
    const source = step.getBoundingClientRect();
    const scale = container.width / builder.offsetWidth || 1;
    const targetX = source.left + source.width / 2;
    const targetY = source.top + source.height / 2;
    fly.innerHTML = step.querySelector('svg').outerHTML;
    fly.style.left = `${(targetX - container.left) / scale}px`;
    fly.style.top = `${(targetY - container.top) / scale}px`;
    const dx = Math.min(60, (container.right - targetX) / scale + 16);
    const dy = -48;
    step.classList.add('arriving');
    flight = fly.animate([
      { opacity: 0, transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.45)` },
      { opacity: 1, transform: `translate(calc(-50% + ${dx * .8}px), calc(-50% + ${dy * .8}px)) scale(1.35)`, offset: .15 },
      { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: .9 },
      { opacity: 0, transform: 'translate(-50%, -50%) scale(1)' }
    ], { duration: 700, easing: 'cubic-bezier(.4,0,.2,1)' });
    assemblyTimers.push(setTimeout(() => {
      step.classList.remove('arriving');
      installModule(name);
    }, 700));
  };
  const play = () => {
    cancelAssembly();
    Object.keys(modules).forEach(name => { modules[name] = name === 'block' || reducedMotion.matches; });
    render();
    if (reducedMotion.matches || !assemblyVisible || document.hidden) return;
    ['text', 'image', 'flex', 'grid', 'ui'].forEach((name, i) =>
      assemblyTimers.push(setTimeout(() => sendModule(name), 500 + i * 1600)));
    assemblyTimers.push(setTimeout(play, 11000));
  };
  render();
  reducedMotion.addEventListener('change', play);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAssembly(); else play(); });
  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('js');
    const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      reveals.unobserve(entry.target);
    }), { threshold: .08 });
    document.querySelectorAll('.reveal').forEach(element => reveals.observe(element));
    const assembly = new IntersectionObserver(entries => {
      const showing = entries[0].isIntersecting;
      if (showing === assemblyVisible) return;
      assemblyVisible = showing;
      if (showing) play(); else cancelAssembly();
    }, { threshold: .2 });
    assembly.observe(builder);
  }
  if (!('IntersectionObserver' in window)) { assemblyVisible = true; play(); }
  // Use one scale across desktop panels while keeping a common visible content width.
  const desktop = matchMedia('(min-width: 900px)');
  const main = document.querySelector('#main');
  const sections = [...main.querySelectorAll(':scope > .section')];
  const screens = sections.map(section => {
    const frame = document.createElement('div');
    frame.className = 'screen-frame';
    frame.dataset.panel = section.id;
    section.before(frame);
    frame.append(section);
    return { frame, section };
  });
  const fitScreens = () => {
    if (!desktop.matches) {
      const viewportHeight = document.documentElement.clientHeight;
      const headerHeight = document.querySelector('.header').offsetHeight;
      const footerHeight = document.querySelector('.footer').offsetHeight;
      screens.forEach(({ frame, section }, index) => {
        const reserved = (index === 0 ? headerHeight : 0) +
          (index === screens.length - 1 ? footerHeight : 0);
        const available = Math.max(1, viewportHeight - reserved);
        // Very short viewports retain readable type rather than forcing an extreme reduction.
        let fit = 1;
        frame.style.setProperty('--screen-fit', fit);
        // Width expands before scaling so the final panel still fills its content gutter.
        for (let pass = 0; pass < 8; pass++) {
          const next = Math.max(.78, Math.min(1, (available - 24) / section.offsetHeight));
          if (Math.abs(next - fit) < .002) break;
          fit = next;
          frame.style.setProperty('--screen-fit', fit);
        }
        frame.style.setProperty('--screen-height', `${Math.max(available, section.offsetHeight * fit + 24)}px`);
        frame.style.setProperty('--screen-fit', fit);
      });
      return;
    }
    const canvasScale = Number.parseFloat(getComputedStyle(main).zoom) || 1;
    const viewportHeight = document.documentElement.clientHeight / canvasScale;
    const headerHeight = document.querySelector('.header').offsetHeight;
    const footerHeight = document.querySelector('.footer').offsetHeight;
    const heights = screens.map(({ section }, index) => {
      const reserved = (index === 0 ? headerHeight : 0) +
        (index === screens.length - 1 ? footerHeight : 0);
      return Math.max(1, viewportHeight - reserved);
    });
    const commonFit = Math.min(1, ...screens.map(({ section }, index) =>
      (heights[index] - 1) / section.offsetHeight));
    screens.forEach(({ frame }, index) => {
      frame.style.setProperty('--screen-height', `${heights[index]}px`);
      frame.style.setProperty('--screen-fit', commonFit);
    });
  };
  let resizeFrame = 0;
  const scheduleFit = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(fitScreens);
  };
  fitScreens();
  addEventListener('resize', scheduleFit, { passive: true });
  desktop.addEventListener('change', scheduleFit);
  const scrollToPanel = hash => {
    const screen = screens.find(({ section }) => `#${section.id}` === hash);
    if (!screen) return false;
    const target = screen.section.id === 'top' ? document.querySelector('.header') : screen.frame;
    target.scrollIntoView({
      block: 'start', behavior: reducedMotion.matches ? 'instant' : 'smooth'
    });
    return true;
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = link.getAttribute('href');
    if (!scrollToPanel(hash)) return;
    event.preventDefault();
    if (location.hash !== hash) history.pushState(null, '', hash);
  });
  // Initial hashes and browser back/forward also align to the outer screen.
  const restorePanel = () => {
    const screen = screens.find(({ section }) => `#${section.id}` === location.hash);
    const target = screen?.section.id === 'top' ? document.querySelector('.header') : screen?.frame;
    target?.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  requestAnimationFrame(restorePanel);
  document.fonts.ready.then(() => { fitScreens(); requestAnimationFrame(restorePanel); });
  addEventListener('load', () => { fitScreens(); requestAnimationFrame(restorePanel); }, { once: true });
  if ('ResizeObserver' in window) {
    const panelSizes = new ResizeObserver(scheduleFit);
    sections.forEach(section => panelSizes.observe(section));
  }
  addEventListener('popstate', restorePanel);
  // A single code edit propagates through both runtimes and updates every device together.
  const platforms = document.querySelector('#apps .platform-diagram');
  if (platforms) {
    const source = platforms.querySelector('.source-window');
    const code = [...source.querySelectorAll('.code-lines i')];
    const runtimeIcons = [...platforms.querySelectorAll('.runtime > svg,.runtime > img')];
    const interfaces = [...platforms.querySelectorAll('.device-row .mini-ui')];
    const svgNS = 'http://www.w3.org/2000/svg';
    const flowOverlay = document.createElementNS(svgNS, 'svg');
    flowOverlay.classList.add('platform-flow');
    flowOverlay.setAttribute('aria-hidden', 'true');
    platforms.append(flowOverlay);
    const baselines = document.createElementNS(svgNS, 'g');
    baselines.classList.add('flow-baselines');
    flowOverlay.append(baselines);
    const baselinePaths = Array.from({ length: 7 }, () => {
      const path = document.createElementNS(svgNS, 'path');
      baselines.append(path);
      return path;
    });
    // Adjacent short strokes form a soft ribbon that follows bends in the line.
    const flows = Array.from({ length: 7 }, () => {
      const group = document.createElementNS(svgNS, 'g');
      for (let i = 0; i < 20; i++) {
        const stroke = document.createElementNS(svgNS, 'path');
        const opacity = i < 16 ? Math.pow((i + 1) / 16, 1.5) : (20 - i) / 5;
        stroke.setAttribute('opacity', opacity.toFixed(3));
        group.append(stroke);
      }
      flowOverlay.append(group);
      return group;
    });
    let platformTimers = [];
    let platformVisible = false;
    const cancelPlatforms = () => {
      platformTimers.forEach(clearTimeout);
      platformTimers = [];
      [...code, ...runtimeIcons, ...interfaces, ...flows, ...flowOverlay.querySelectorAll('path')].forEach(el =>
        el.getAnimations().forEach(animation => animation.cancel()));
    };
    const measurePaths = () => {
      const outer = platforms.getBoundingClientRect();
      const scale = outer.width / platforms.offsetWidth || 1;
      flowOverlay.setAttribute('viewBox', `0 0 ${platforms.offsetWidth} ${platforms.offsetHeight}`);
      const box = el => {
        const r = el.getBoundingClientRect();
        return { left: (r.left - outer.left) / scale, top: (r.top - outer.top) / scale,
          width: r.width / scale, height: r.height / scale };
      };
      const fork = platforms.querySelector('.fork');
      const f = box(fork);
      const stem = parseFloat(getComputedStyle(fork, '::before').height);
      const cx = f.left + f.width / 2;
      const corner = Math.min(18, f.height / 2);
      const top = f.top;
      const paths = [
        `M${cx} ${top - stem}V${top}H${f.left + corner}Q${f.left} ${top} ${f.left} ${top + corner}V${top + f.height}`,
        `M${cx} ${top - stem}V${top}H${f.left + f.width - corner}Q${f.left + f.width} ${top} ${f.left + f.width} ${top + corner}V${top + f.height}`
      ];
      const routes = [...platforms.querySelectorAll('.device-routes > span')];
      const web = box(routes[0]);
      const native = box(routes[1]);
      const nativeStem = parseFloat(getComputedStyle(routes[1], '::before').height);
      paths.push(`M${web.left} ${web.top}V${web.top + web.height}`);
      const nx = native.left + native.width / 2;
      const ny = native.top + native.height - nativeStem;
      const nc = Math.min(12, native.height / 2);
      paths.push(`M${nx} ${ny}V${native.top}`);
      paths.push(`M${nx} ${native.top}H${native.left + nc}Q${native.left} ${native.top} ${native.left} ${native.top + nc}V${native.top + native.height}`);
      paths.push(`M${nx} ${native.top}V${native.top + native.height}`);
      paths.push(`M${nx} ${native.top}H${native.left + native.width - nc}Q${native.left + native.width} ${native.top} ${native.left + native.width} ${native.top + nc}V${native.top + native.height}`);
      if (innerWidth < 900) {
        const label = box(platforms.querySelector('.centered'));
        const runtimes = [...platforms.querySelectorAll('.runtime')].map(box);
        const devices = [...platforms.querySelectorAll('.device-row .device')].map(box);
        const sx = box(source).left + box(source).width / 2;
        const sy = label.top + label.height + 8;
        const splitY = sy + 22;
        const incoming = runtimes.map(r => {
          const x = r.left + r.width / 2;
          const y = r.top - 8;
          const direction = Math.sign(x - sx);
          return `M${sx} ${sy}V${splitY}H${x - direction * 12}Q${x} ${splitY} ${x} ${splitY + 12}V${y}`;
        });
        const center = d => d.left + d.width / 2;
        const webX = center(devices[0]);
        const runtimeX = runtimes[1].left + runtimes[1].width / 2;
        const runtimeY = runtimes[1].top + runtimes[1].height + 8;
        const junctionX = center(devices[2]);
        const junctionY = Math.min(...devices.slice(1).map(d => d.top)) - 14;
        paths.splice(0, paths.length, ...incoming,
          `M${runtimes[0].left + runtimes[0].width / 2} ${runtimes[0].top + runtimes[0].height + 8}V${devices[0].top - 22}H${webX}V${devices[0].top - 5}`,
          `M${runtimeX} ${runtimeY}V${junctionY - 12}Q${runtimeX} ${junctionY} ${junctionX} ${junctionY}`,
          ...devices.slice(1).map(d => {
            const x = center(d);
            if (Math.abs(x - junctionX) < 1) return `M${junctionX} ${junctionY}V${d.top - 4}`;
            const direction = Math.sign(x - junctionX);
            return `M${junctionX} ${junctionY}H${x - direction * 8}Q${x} ${junctionY} ${x} ${junctionY + 8}V${d.top - 4}`;
          }));
      }
      paths.forEach((path, i) => baselinePaths[i].setAttribute('d', path));
      paths.forEach((path, i) => {
        const strokes = [...flows[i].children];
        strokes.forEach(stroke => stroke.setAttribute('d', path));
        const length = strokes[0].getTotalLength();
        const trail = Math.min(72, Math.max(12, length * .55));
        flows[i].dataset.length = length;
        flows[i].dataset.trail = trail;
        strokes.forEach(stroke => {
          stroke.style.strokeDasharray = `${trail / 20 + .4} ${length + trail * 2}`;
          stroke.style.strokeDashoffset = String(trail);
        });
      });
    };
    const travel = (flow, duration) => {
      const length = Number(flow.dataset.length);
      const trail = Number(flow.dataset.trail);
      flow.animate([{ opacity: 0 }, { opacity: 1, offset: .08 },
        { opacity: 1, offset: .92 }, { opacity: 0 }], { duration });
      [...flow.children].forEach((stroke, i) => stroke.animate([
        { strokeDashoffset: String(trail - i * trail / 20) },
        { strokeDashoffset: String(-length - trail - i * trail / 20) }
      ], { duration, easing: 'linear' }));
    };
    const playPlatforms = () => {
      cancelPlatforms();
      platforms.dataset.updated = 'false';
      platforms.dataset.editing = 'false';
      if (!platformVisible || document.hidden || reducedMotion.matches) return;
      measurePaths();
      const later = (delay, action) => platformTimers.push(setTimeout(action, delay));
      later(700, () => {
        platforms.dataset.editing = 'true';
        code.forEach((line, i) => {
        const changed = [1.15, .72, 1.2, .82, .95][i];
        line.animate([{ transform: 'scaleX(1)' }, { transform: `scaleX(${changed})` }],
          { duration: 650, delay: i * 50, fill: 'forwards', easing: 'ease-in-out' });
        });
      });
      later(1500, () => { travel(flows[0], 1150); travel(flows[1], 1150); });
      later(2650, () => {
        runtimeIcons.forEach(icon => icon.animate([
          { transform: 'scale(1)' }, { transform: 'scale(1.10)', offset: .4 }, { transform: 'scale(1)' }
        ], { duration: 600, easing: 'ease-in-out' }));
        travel(flows[2], 800);
        travel(flows[3], 450);
        // The leading edge reaches the junction before its trailing glow clears.
        const stemLength = Number(flows[3].dataset.length);
        const stemTrail = Number(flows[3].dataset.trail);
        const junctionDelay = 450 * (stemLength + stemTrail / 20) / (stemLength + 2 * stemTrail);
        later(junctionDelay, () => flows.slice(4).forEach(flow => travel(flow, 650)));
      });
      later(3600, () => {
        platforms.dataset.updated = 'true';
        interfaces.forEach(ui => ui.animate([{ opacity: .45 }, { opacity: 1 }],
          { duration: 700, easing: 'ease-out' }));
      });
      later(7000, () => {
        platforms.dataset.updated = 'false';
        platforms.dataset.editing = 'false';
        code.forEach(line => line.getAnimations().forEach(animation => animation.cancel()));
        interfaces.forEach(ui => ui.animate([{ opacity: .55 }, { opacity: 1 }],
          { duration: 700, easing: 'ease-out' }));
      });
      later(8200, playPlatforms);
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
      const showing = entries[0].isIntersecting;
      if (showing === platformVisible) return;
      platformVisible = showing;
      if (showing) playPlatforms(); else cancelPlatforms();
    }, { threshold: .2 }).observe(platforms);
    else { platformVisible = true; playPlatforms(); }
    if ('ResizeObserver' in window) new ResizeObserver(measurePaths).observe(platforms);
    document.fonts.ready.then(measurePaths);
    reducedMotion.addEventListener('change', playPlatforms);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelPlatforms(); else playPlatforms();
    });
  }
  const lightComparison = document.querySelector('#performance .performance-comparison');
  if (lightComparison) {
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
      lightComparison.dataset.visible = String(entries[0].isIntersecting);
    }, { threshold: .15 }).observe(lightComparison);
    else lightComparison.dataset.visible = 'true';
  }

})();
