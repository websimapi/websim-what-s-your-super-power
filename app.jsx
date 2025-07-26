import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { WebsimSocket, useQuery } from "@websim/use-query";
import dbManager from "./database.js";
import effectsEngine from "./effects.js";
const room = new WebsimSocket();
function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [gameState, setGameState] = useState("loading");
  const [identity, setIdentity] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const [lastEvolution, setLastEvolution] = useState(null);
  const { data: userData, loading: userLoading } = useQuery(
    currentUser ? room.collection("users").filter({ id: currentUser.id }) : null
  );
  const { data: userDatapoints, loading: datapointsLoading } = useQuery(
    currentUser ? room.query(`
            SELECT 
                d.id,
                d.name,
                d.data_type,
                d.value,
                d.rarity,
                d.visual_properties,
                ud.visual_intensity,
                ud.acquired_at
            FROM public.user_datapoints ud
            JOIN public.datapoints d ON ud.datapoint_id = d.id
            WHERE ud.user_id = $1
            ORDER BY ud.acquired_at DESC
        `, [currentUser.id]) : null
  );
  useEffect(() => {
    initializeUser();
  }, []);
  useEffect(() => {
    if (userData && userData[0]) {
      setUserAvatar(userData[0]);
      setGameState("playing");
    } else if (currentUser && !userLoading) {
      setGameState("identity_input");
    }
  }, [userData, currentUser, userLoading]);
  useEffect(() => {
    if (userDatapoints && userDatapoints.length > 0) {
      const avatarElement = document.querySelector(".user-avatar");
      if (avatarElement) {
        effectsEngine.applyEffectToImage(avatarElement, userDatapoints);
        effectsEngine.createAmbientEffect(userDatapoints);
      }
    }
  }, [userDatapoints]);
  async function initializeUser() {
    try {
      const user = await window.websim.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to get current user:", error);
    }
  }
  async function handleIdentitySubmit() {
    if (!identity.trim() || !currentUser) return;
    setIsGenerating(true);
    try {
      const user = await dbManager.createUser(identity);
      setUserAvatar(user);
      setGameState("playing");
      setTimeout(handleEvolution, 3e3);
    } catch (error) {
      console.error("Failed to create user:", error);
    } finally {
      setIsGenerating(false);
    }
  }
  async function handleEvolution() {
    if (!currentUser) return;
    try {
      const result = await dbManager.evolveUser(currentUser.id);
      if (result.canEvolve) {
        setLastEvolution(result.newDatapoint);
        showEvolutionNotification(result.newDatapoint);
      } else {
        console.log(`Cannot evolve yet. Wait ${Math.ceil(result.timeRemaining)} more minutes.`);
      }
    } catch (error) {
      console.error("Evolution failed:", error);
    }
  }
  function showEvolutionNotification(datapoint) {
    const notification = document.createElement("div");
    notification.className = "fixed top-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg shadow-lg z-50 transform translate-x-full";
    notification.innerHTML = `
            <h3 class="font-bold">New Datapoint Acquired!</h3>
            <p class="text-sm">${datapoint.name}</p>
            <p class="text-xs opacity-75">${datapoint.value}</p>
        `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
      notification.style.transition = "transform 0.3s ease";
    }, 100);
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => notification.remove(), 300);
    }, 5e3);
  }
  if (gameState === "loading") {
    return /* @__PURE__ */ jsxDEV("div", { className: "game-container", children: [
      /* @__PURE__ */ jsxDEV("h1", { className: "title", children: "What's Your Super Power?" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 138,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "loading-spinner" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 139,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-center mt-4", children: "Connecting to the cosmic database..." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 140,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 137,
      columnNumber: 13
    }, this);
  }
  if (gameState === "identity_input") {
    return /* @__PURE__ */ jsxDEV("div", { className: "game-container", children: [
      /* @__PURE__ */ jsxDEV("h1", { className: "title", children: "What's Your Super Power?" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 148,
        columnNumber: 17
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "queue-status", children: [
        /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl font-bold mb-4", children: "Choose Your Identity" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 150,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "mb-4", children: "Tell the AI what you want to be, and it will generate your unique avatar and begin your evolution journey." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 151,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "input-group", children: [
          /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "text",
              className: "identity-input",
              placeholder: "I want to be a...",
              value: identity,
              onChange: (e) => setIdentity(e.target.value),
              onKeyPress: (e) => e.key === "Enter" && handleIdentitySubmit(),
              disabled: isGenerating
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 154,
              columnNumber: 25
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              className: "generate-btn",
              onClick: handleIdentitySubmit,
              disabled: isGenerating || !identity.trim(),
              children: isGenerating ? "Generating Avatar..." : "Begin Evolution"
            },
            void 0,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 163,
              columnNumber: 25
            },
            this
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 153,
          columnNumber: 21
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 149,
        columnNumber: 17
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 147,
      columnNumber: 13
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("div", { className: "game-container", children: [
    /* @__PURE__ */ jsxDEV("h1", { className: "title", children: "What's Your Super Power?" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 178,
      columnNumber: 13
    }, this),
    userAvatar && /* @__PURE__ */ jsxDEV("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxDEV(
        "img",
        {
          src: userAvatar.base_image_url,
          alt: "Your Avatar",
          className: "user-avatar",
          onLoad: (e) => {
            if (userDatapoints && userDatapoints.length > 0) {
              effectsEngine.applyEffectToImage(e.target, userDatapoints);
            }
          }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 182,
          columnNumber: 21
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl font-bold mt-4", children: userAvatar.identity }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 192,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-lg", children: [
        "Evolution Level: ",
        userAvatar.evolution_level
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 193,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "evolution-progress", children: /* @__PURE__ */ jsxDEV(
        "div",
        {
          className: "evolution-progress-bar",
          style: { width: `${Math.min((userDatapoints?.length || 0) * 10, 100)}%` }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 196,
          columnNumber: 25
        },
        this
      ) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 195,
        columnNumber: 21
      }, this),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          className: "generate-btn mt-4",
          onClick: handleEvolution,
          children: "Evolve Now"
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 202,
          columnNumber: 21
        },
        this
      )
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 181,
      columnNumber: 17
    }, this),
    userDatapoints && userDatapoints.length > 0 && /* @__PURE__ */ jsxDEV("div", { className: "datapoints-grid", children: userDatapoints.map((datapoint) => /* @__PURE__ */ jsxDEV(
      "div",
      {
        className: "datapoint-card",
        style: {
          borderColor: datapoint.visual_properties?.color || "#fff",
          boxShadow: `0 0 ${datapoint.visual_intensity * 20}px ${datapoint.visual_properties?.color}40`
        },
        children: [
          /* @__PURE__ */ jsxDEV("div", { className: "datapoint-name", children: datapoint.name }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 222,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "datapoint-value", children: [
            datapoint.data_type,
            ": ",
            datapoint.value
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 223,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "text-xs mt-2", children: [
            "Rarity: ",
            (datapoint.rarity * 100).toFixed(0),
            "%"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 226,
            columnNumber: 29
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "text-xs", children: [
            "Intensity: ",
            (datapoint.visual_intensity * 100).toFixed(0),
            "%"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 229,
            columnNumber: 29
          }, this)
        ]
      },
      datapoint.id,
      true,
      {
        fileName: "<stdin>",
        lineNumber: 214,
        columnNumber: 25
      },
      this
    )) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 212,
      columnNumber: 17
    }, this),
    (!userDatapoints || userDatapoints.length === 0) && !datapointsLoading && /* @__PURE__ */ jsxDEV("div", { className: "text-center mt-8", children: /* @__PURE__ */ jsxDEV("p", { className: "text-lg", children: "No datapoints yet. Your evolution journey is about to begin!" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 239,
      columnNumber: 21
    }, this) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 238,
      columnNumber: 17
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 177,
    columnNumber: 9
  }, this);
}
const root = createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 247,
  columnNumber: 13
}));
