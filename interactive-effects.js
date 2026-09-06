(() => {
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const motionPaused = () => motionPreference.matches || document.documentElement.classList.contains("motion-paused");

  const gallery = document.querySelector(".learning-gallery");
  const previous = document.querySelector(".gallery-prev");
  const next = document.querySelector(".gallery-next");
  const progress = document.querySelector(".gallery-progress i");
  const galleryCount = document.querySelector(".gallery-count");

  if (gallery && previous && next && progress && galleryCount) {
    const cards = [...gallery.querySelectorAll(".learning-card")];
    let step = 320;
    let cardWidth = 304;
    let galleryFrame = 0;
    let pointerId = null;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let dragged = false;

    const updateGallery = () => {
      const max = Math.max(0, gallery.scrollWidth - gallery.clientWidth);
      const left = Math.max(0, gallery.scrollLeft);
      const right = left + gallery.clientWidth;
      const visible = cards.map((_, index) => index).filter((index) => {
        const overlap = Math.min(index * step + cardWidth, right) - Math.max(index * step, left);
        return overlap >= cardWidth / 2;
      });
      const first = (visible[0] ?? 0) + 1;
      const last = (visible.at(-1) ?? 0) + 1;
      const pad = (value) => String(value).padStart(2, "0");
      progress.style.transform = `scaleX(${cards.length ? last / cards.length : 0})`;
      const range = first === last ? pad(first) : `${pad(first)}–${pad(last)}`;
      const label = `${range} / ${pad(cards.length)}`;
      if (galleryCount.textContent !== label) galleryCount.textContent = label;
      previous.disabled = gallery.scrollLeft <= 2 || !max;
      next.disabled = gallery.scrollLeft >= max - 2 || !max;
    };
    const scheduleGalleryUpdate = () => {
      if (galleryFrame) return;
      galleryFrame = requestAnimationFrame(() => {
        galleryFrame = 0;
        updateGallery();
      });
    };
    const measureGallery = () => {
      const gap = Number.parseFloat(getComputedStyle(gallery).columnGap) || 0;
      cardWidth = cards[0]?.offsetWidth || 320;
      step = cardWidth + gap;
      scheduleGalleryUpdate();
    };
    const moveGallery = (direction, keyboard = false) => {
      gallery.scrollBy({ left: direction * step, behavior: keyboard || motionPaused() ? "instant" : "smooth" });
    };
    previous.addEventListener("click", (event) => moveGallery(-1, event.detail === 0));
    next.addEventListener("click", (event) => moveGallery(1, event.detail === 0));
    gallery.addEventListener("scroll", scheduleGalleryUpdate, { passive: true });
    gallery.addEventListener("keydown", (event) => {
      if (event.target !== gallery) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        moveGallery(event.key === "ArrowLeft" ? -1 : 1, true);
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        gallery.scrollTo({ left: event.key === "Home" ? 0 : gallery.scrollWidth, behavior: "instant" });
      }
    });
    gallery.addEventListener("pointerdown", (event) => {
      if (pointerId !== null || !event.isPrimary || event.pointerType === "touch" || event.button !== 0) return;
      pointerId = event.pointerId;
      dragStartX = event.clientX;
      dragStartScroll = gallery.scrollLeft;
      dragged = false;
    });
    gallery.addEventListener("pointermove", (event) => {
      if (event.pointerId !== pointerId) return;
      const distance = event.clientX - dragStartX;
      if (!dragged && Math.abs(distance) < 6) return;
      if (!dragged) {
        dragged = true;
        gallery.classList.add("is-dragging");
        gallery.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      gallery.scrollLeft = dragStartScroll - distance;
    });
    const stopGalleryDrag = (event) => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      gallery.classList.remove("is-dragging");
      if (gallery.hasPointerCapture(event.pointerId)) gallery.releasePointerCapture(event.pointerId);
      scheduleGalleryUpdate();
    };
    gallery.addEventListener("pointerup", stopGalleryDrag);
    gallery.addEventListener("pointercancel", stopGalleryDrag);
    gallery.addEventListener("lostpointercapture", stopGalleryDrag);
    gallery.addEventListener("pointerleave", (event) => {
      if (!dragged) stopGalleryDrag(event);
    });
    gallery.addEventListener("click", (event) => {
      if (!dragged || event.detail === 0) return;
      event.preventDefault();
      event.stopPropagation();
      dragged = false;
    }, true);
    gallery.addEventListener("dragstart", (event) => event.preventDefault());
    const galleryResize = new ResizeObserver(measureGallery);
    galleryResize.observe(gallery);
    if (cards[0]) galleryResize.observe(cards[0]);
    measureGallery();
  }

  const sphere = document.querySelector(".image-sphere");
  const sphereLabel = document.querySelector(".sphere-label");
  const sphereProfile = document.querySelector(".sphere-profile");
  if (!sphere) return;
  const people = [...sphere.querySelectorAll(".sphere-person")];
  if (!people.length) return;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const points = people.map((_, index) => {
    const y = 0.84 - (index / Math.max(1, people.length - 1)) * 1.68;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * index;
    return { x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius };
  });
  let rotationX = -0.18;
  let rotationY = 0.4;
  let radius = 0;
  let scaleLimit = 1;
  let sphereFrame = 0;
  let previousTime = 0;
  let pointerId = null;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let sphereVisible = false;
  let selectedPerson = null;
  let pressedPerson = null;
  let pointerInside = false;
  let keyboardInteraction = false;
  const defaultLabel = {
    title: sphereLabel?.querySelector("strong")?.textContent || "Arraste ou use as setas para explorar",
    role: sphereLabel?.querySelector("span")?.textContent || "Comunidade brasileira",
  };
  sphere.tabIndex = 0;
  sphere.setAttribute("aria-label", "Perfis da comunidade brasileira. Use as setas ou arraste para girar. Use Tab para escolher um perfil e Enter para abrir seu resumo.");

  const renderSphere = () => {
    const cosY = Math.cos(rotationY); const sinY = Math.sin(rotationY);
    const cosX = Math.cos(rotationX); const sinX = Math.sin(rotationX);
    points.forEach((point, index) => {
      const x = point.x * cosY + point.z * sinY;
      const z1 = -point.x * sinY + point.z * cosY;
      const y = point.y * cosX - z1 * sinX;
      const z = point.y * sinX + z1 * cosX;
      const depth = (z + 1) / 2;
      const scale = (0.62 + depth * 0.5) * scaleLimit;
      const person = people[index];
      const focused = document.activeElement === person;
      person.style.transform = `translate3d(calc(-50% + ${x * radius}px), calc(-50% + ${y * radius}px), 0) scale(${scale})`;
      person.style.opacity = focused ? "1" : String(0.42 + depth * 0.58);
      person.style.zIndex = focused ? "200" : String(Math.round(depth * 100));
    });
  };
  const canAnimate = () => sphereVisible && !document.hidden && !motionPaused() && pointerId === null && !pointerInside && !selectedPerson && !(keyboardInteraction && sphere.contains(document.activeElement));
  const animateSphere = (time) => {
    sphereFrame = 0;
    if (!canAnimate()) { previousTime = 0; return; }
    const elapsed = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
    previousTime = time;
    rotationY = (rotationY + elapsed * 0.12) % (Math.PI * 2);
    renderSphere();
    sphereFrame = requestAnimationFrame(animateSphere);
  };
  const syncSphereMotion = () => {
    if (canAnimate()) {
      if (!sphereFrame) sphereFrame = requestAnimationFrame(animateSphere);
    } else {
      cancelAnimationFrame(sphereFrame);
      sphereFrame = 0;
      previousTime = 0;
    }
  };
  const measureSphere = () => {
    const size = Math.min(sphere.clientWidth, sphere.clientHeight || sphere.clientWidth);
    const personSize = Math.max(1, ...people.map((person) => Math.max(person.offsetWidth, person.offsetHeight)));
    scaleLimit = Math.min(1, Math.max(0.1, (size - 24) / (personSize * 1.12)));
    radius = Math.max(0, Math.min(size * 0.34, size / 2 - personSize * 1.12 * scaleLimit / 2 - 12));
    renderSphere();
  };
  const setLabel = (title, role) => {
    const titleNode = sphereLabel?.querySelector("strong");
    const roleNode = sphereLabel?.querySelector("span");
    if (titleNode) titleNode.textContent = title;
    if (roleNode) roleNode.textContent = role;
  };
  const closeProfile = (restoreFocus = false) => {
    if (!sphereProfile) return;
    const previousPerson = selectedPerson;
    selectedPerson = null;
    sphereProfile.hidden = true;
    sphereProfile.parentElement.classList.remove("profile-open");
    people.forEach((person) => person.setAttribute("aria-expanded", "false"));
    if (restoreFocus) previousPerson?.focus({ preventScroll: true });
    syncSphereMotion();
  };
  const showProfile = (person) => {
    if (!sphereProfile) return;
    selectedPerson = person;
    people.forEach((item) => item.setAttribute("aria-expanded", String(item === person)));
    const sourceImage = person.querySelector("img");
    const profileImage = sphereProfile.querySelector(".sphere-profile-heading img");
    const name = sphereProfile.querySelector(".sphere-profile-name");
    const summary = sphereProfile.querySelector(".sphere-profile-summary");
    const role = sphereProfile.querySelector(".sphere-profile-role");
    const link = sphereProfile.querySelector(".sphere-profile-link");
    if (profileImage && sourceImage) {
      profileImage.src = sourceImage.currentSrc || sourceImage.src;
      profileImage.alt = person.dataset.title || "";
    }
    if (role) role.textContent = person.dataset.role || "";
    if (name) {
      name.textContent = person.dataset.title || "";
      name.tabIndex = -1;
    }
    if (summary) {
      summary.textContent = person.dataset.summary || "";
      summary.id ||= "sphere-profile-summary";
      name?.setAttribute("aria-describedby", summary.id);
    }
    if (link) link.href = person.dataset.github || "https://github.com/";
    sphereProfile.hidden = false;
    sphereProfile.parentElement.classList.add("profile-open");
    name?.focus({ preventScroll: true });
    syncSphereMotion();
  };

  sphere.addEventListener("pointerdown", (event) => {
    if (pointerId !== null || !event.isPrimary || event.button !== 0) return;
    keyboardInteraction = false;
    pointerId = event.pointerId;
    moved = false;
    startX = lastX = event.clientX;
    startY = lastY = event.clientY;
    pressedPerson = event.target.closest(".sphere-person");
    sphere.setPointerCapture(event.pointerId);
    syncSphereMotion();
  });
  sphere.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") pointerInside = true;
    syncSphereMotion();
  });
  sphere.addEventListener("pointerleave", () => {
    pointerInside = false;
    syncSphereMotion();
  });
  sphere.addEventListener("pointermove", (event) => {
    if (event.pointerId !== pointerId) return;
    if (!moved && Math.hypot(event.clientX - startX, event.clientY - startY) < 5) return;
    moved = true;
    sphere.classList.add("dragging");
    rotationY += (event.clientX - lastX) * 0.006;
    rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX - (event.clientY - lastY) * 0.006));
    lastX = event.clientX;
    lastY = event.clientY;
    renderSphere();
  });
  const releaseSphere = (event, cancelled = false) => {
    if (event.pointerId !== pointerId) return;
    const personToOpen = !cancelled && !moved ? pressedPerson : null;
    pointerId = null;
    pressedPerson = null;
    sphere.classList.remove("dragging");
    if (sphere.hasPointerCapture(event.pointerId)) sphere.releasePointerCapture(event.pointerId);
    const rect = sphere.getBoundingClientRect();
    pointerInside = event.pointerType === "mouse" && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (personToOpen) showProfile(personToOpen);
    syncSphereMotion();
  };
  sphere.addEventListener("pointerup", (event) => releaseSphere(event));
  sphere.addEventListener("pointercancel", (event) => releaseSphere(event, true));
  sphere.addEventListener("lostpointercapture", (event) => releaseSphere(event, true));
  sphere.addEventListener("click", (event) => {
    if (moved && event.detail !== 0) {
      event.preventDefault();
      event.stopPropagation();
      moved = false;
      return;
    }
    // Pointer activation is handled on release because capture retargets clicks.
    if (event.detail !== 0) return;
    moved = false;
    const person = event.target.closest(".sphere-person");
    if (person) showProfile(person);
  });
  sphere.addEventListener("dragstart", (event) => event.preventDefault());
  sphere.addEventListener("focusin", (event) => {
    if (event.target.matches(":focus-visible")) keyboardInteraction = true;
    renderSphere();
    syncSphereMotion();
  });
  sphere.addEventListener("focusout", () => queueMicrotask(() => {
    renderSphere();
    syncSphereMotion();
  }));
  sphereProfile?.querySelector(".sphere-profile-close")?.addEventListener("click", () => closeProfile(true));
  document.addEventListener("keydown", (event) => {
    keyboardInteraction = true;
    syncSphereMotion();
    if (event.key === "Escape" && sphereProfile && !sphereProfile.hidden) {
      event.preventDefault();
      closeProfile(true);
    }
  });
  sphere.addEventListener("keydown", (event) => {
    const keys = { ArrowLeft: -0.18, ArrowRight: 0.18, ArrowUp: -0.18, ArrowDown: 0.18 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") rotationY += keys[event.key];
    else rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX + keys[event.key]));
    renderSphere();
  });
  people.forEach((person) => {
    const describe = () => setLabel(person.dataset.title || "", person.dataset.role || "");
    const reset = () => {
      const focused = people.find((item) => item === document.activeElement);
      if (focused) setLabel(focused.dataset.title || "", focused.dataset.role || "");
      else setLabel(motionPaused() ? "Giro pausado · arraste para explorar" : defaultLabel.title, defaultLabel.role);
    };
    person.addEventListener("mouseenter", describe);
    person.addEventListener("focus", describe);
    person.addEventListener("mouseleave", reset);
    person.addEventListener("blur", () => queueMicrotask(reset));
  });
  new IntersectionObserver(([entry]) => {
    sphereVisible = entry.isIntersecting;
    syncSphereMotion();
  }, { threshold: 0.02 }).observe(sphere);
  const sphereResize = new ResizeObserver(measureSphere);
  sphereResize.observe(sphere);
  people.forEach((person) => sphereResize.observe(person));
  document.addEventListener("visibilitychange", syncSphereMotion);
  window.addEventListener("portfolio-motion", syncSphereMotion);
  const updateMotionLabel = () => {
    if (!selectedPerson && !people.includes(document.activeElement)) {
      setLabel(motionPaused() ? "Giro pausado · arraste para explorar" : defaultLabel.title, defaultLabel.role);
    }
  };
  window.addEventListener("portfolio-motion", updateMotionLabel);
  motionPreference.addEventListener("change", updateMotionLabel);
  updateMotionLabel();
  motionPreference.addEventListener("change", syncSphereMotion);
  measureSphere();
})();
