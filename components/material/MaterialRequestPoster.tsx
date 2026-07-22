"use client";

import { useEffect } from "react";

const LOCAL_API_URL = "http://localhost:3000/api/material-request";
const PROD_API_URL = "https://sinergi.ptrekaindo.co.id/api/material-request";

function getMaterialRequestUrl() {
  if (typeof window === "undefined") {
    return PROD_API_URL;
  }

  const hostname = window.location.hostname;
  const envOverride = process.env.NEXT_PUBLIC_MATERIAL_REQUEST_URL?.trim();
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const url = envOverride || (isLocal ? LOCAL_API_URL : PROD_API_URL);

  console.log("[MaterialRequestPoster] hostname:", hostname);
  //console.log("[MaterialRequestPoster] using URL:", url);
  if (envOverride) {
    console.log("[MaterialRequestPoster] NEXT_PUBLIC_MATERIAL_REQUEST_URL override detected");
  }

  return url;
}

export default function MaterialRequestPoster() {
  useEffect(() => {
    const sendMaterialRequest = async () => {
      const url = getMaterialRequestUrl();
      //console.log("[MaterialRequestPoster] Sending POST to", url);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        //console.log("[MaterialRequestPoster] Response status:", response.status, "ok:", response.ok);
        if (!response.ok) {
          const bodyText = await response.text().catch(() => "<unable to read body>");
          console.error("[MaterialRequestPoster] POST failed:", response.status, response.statusText, bodyText);
        }
      } catch (error) {
        console.error("[MaterialRequestPoster] Failed to send material request POST:", error);
      }
    };

    sendMaterialRequest();
  }, []);

  return null;
}
