"use client";

import React from "react";
import { FUNNEL_MAX_WIDTH, TOTAL_HEIGHT, TOP_RIM_GUARD, STAGE_META, RENDER_ORDER, frustumPath } from "@/components/material/pengadaan-utils";

function Rim({ cx, y, w, rim, hole }) {
  const ry = Math.max(6, w * 0.12);
  const holeRy = ry * 0.72;
  const holeRx = (w / 2) * 0.72;
  return (
    <>
      <ellipse cx={cx} cy={y} rx={w / 2} ry={ry} fill={rim} style={{ transition: "all 700ms cubic-bezier(.22,.9,.34,1)" }} />
      <ellipse
        cx={cx}
        cy={y}
        rx={holeRx}
        ry={holeRy}
        fill={hole}
        opacity={0.85}
        style={{ transition: "all 700ms cubic-bezier(.22,.9,.34,1)", animation: "rimPulse 3.4s ease-in-out infinite" }}
      />
    </>
  );
}

export default function PengadaanFunnel({ data, geom, cx, metaByKey, mounted }) {
  return (
    <div style={{ position: "relative", width: FUNNEL_MAX_WIDTH, flexShrink: 0, paddingTop: TOP_RIM_GUARD }}>
      <svg
        width={FUNNEL_MAX_WIDTH}
        height={TOTAL_HEIGHT + TOP_RIM_GUARD}
        viewBox={`0 0 ${FUNNEL_MAX_WIDTH} ${TOTAL_HEIGHT + TOP_RIM_GUARD}`}
        style={{ position: "relative", display: "block", overflow: "visible" }}
      >
        <defs>
          {STAGE_META.map((meta) => (
            <linearGradient key={meta.key} id={`grad-${meta.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={meta.colorFrom} />
              <stop offset="100%" stopColor={meta.colorTo} />
            </linearGradient>
          ))}
        </defs>

        {RENDER_ORDER.map((key) => {
          const meta = metaByKey[key];
          const g = geom[key];
          return (
            <g key={key}>
              <path
                d={frustumPath(cx, g.y, g.h, g.top, g.bottom)}
                fill={`url(#grad-${meta.key})`}
                style={{ transition: "d 700ms cubic-bezier(.22,.9,.34,1)" }}
              />
              <Rim cx={cx} y={g.y} w={g.top} rim={meta.rim} hole={meta.hole} />
              <Rim cx={cx} y={g.y + g.h} w={g.bottom} rim={meta.rim} hole={meta.hole} />
              <text x={cx} y={g.y + g.h * 0.42} textAnchor="middle" fontSize="17" fontWeight="700" fill="#fff">
                {meta.label}
              </text>
              <text
                x={cx}
                y={g.y + g.h * 0.42 + 24}
                textAnchor="middle"
                fontSize="20"
                fontWeight="800"
                fill="#fff"
                opacity={mounted ? 1 : 0}
                style={{ transition: "opacity 500ms" }}
              >
                {data[`${meta.key}_percentage`]}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
