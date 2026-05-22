import React, { useState, useEffect, useRef } from 'react';

const OVERLAY_TYPES = ['modal', 'popup', 'slideover', 'wheel'];

// Shared iframe boilerplate: height reporting + active detection scripts
const IFRAME_RUNTIME = `
const{useState,useEffect,useRef,useCallback,useMemo,useReducer}=React;

function reportHeight(){
  requestAnimationFrame(function(){
    var h=Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.scrollHeight
    );
    parent.postMessage({type:"pf-height",height:h},"*");
  });
}
var _ro=new ResizeObserver(function(){reportHeight();});
_ro.observe(document.body);
var _rootEl=document.getElementById("root");
if(_rootEl)_ro.observe(_rootEl);
setTimeout(function(){
  var r=document.getElementById("root");
  if(r)_ro.observe(r);
  reportHeight();
},50);

var _lastActive=null;
function checkActive(){
  var root=document.getElementById("root");
  var active=!!(root&&root.children.length>0&&root.firstElementChild);
  if(active!==_lastActive){
    _lastActive=active;
    parent.postMessage({type:"pf-active",active:active},"*");
  }
}
var _mo=new MutationObserver(checkActive);
_mo.observe(document.getElementById("root")||document.body,{childList:true,subtree:true});
`.trim();

const IFRAME_HEAD = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<script src="https://cdn.tailwindcss.com"><\/script>
<style>html,body{margin:0;padding:0;background:transparent;}#root{display:block;}<\/style>
</head>
<body>
<div id="root"></div>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>`;

/**
 * Build iframe doc for pre-compiled JS (no Babel needed).
 * esbuild has already transformed JSX → React.createElement calls.
 */
function buildCompiledDoc(compiledJs) {
    const safe = JSON.stringify(compiledJs)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e');

    return `${IFRAME_HEAD}
<script>
${IFRAME_RUNTIME}
try{
  eval(${safe});
}catch(e){
  document.getElementById("root").innerHTML=
    "<div style='padding:16px;color:#dc2626;font-size:13px;font-family:monospace;white-space:pre-wrap'>"
    +"<b>Error:</b> "+e.message+"<\/div>";
}
<\/script>
</body>
</html>`;
}

/**
 * Build iframe doc for raw JSX — loads Babel standalone as fallback.
 * Used only for forms that pre-date server-side compilation.
 */
function buildJsxDoc(jsxCode) {
    const safe = JSON.stringify(jsxCode)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e');

    return `${IFRAME_HEAD}
<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
<script>
${IFRAME_RUNTIME}
try{
  var _c=${safe};
  eval(Babel.transform(_c,{presets:["react"]}).code);
}catch(e){
  document.getElementById("root").innerHTML=
    "<div style='padding:16px;color:#dc2626;font-size:13px;font-family:monospace;white-space:pre-wrap'>"
    +"<b>Error:</b> "+e.message+"<\/div>";
}
<\/script>
</body>
</html>`;
}

// ─── Inline iframe ────────────────────────────────────────────────────────────

function InlineFrame({ doc }) {
    const iframeRef = useRef(null);
    const [height, setHeight] = useState(120);

    useEffect(() => {
        function onMessage(e) {
            if (!iframeRef.current || e.source !== iframeRef.current.contentWindow) return;
            if (e.data?.type === 'pf-height' && typeof e.data.height === 'number') {
                setHeight(Math.max(e.data.height, 0));
            }
        }
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);

    return (
        <iframe
            ref={iframeRef}
            srcDoc={doc}
            title="PromptForm"
            scrolling="no"
            allowTransparency="true"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{
                width: '100%',
                height: height + 'px',
                border: 'none',
                display: 'block',
                background: 'transparent',
                overflow: 'hidden',
                transition: 'height 0.2s ease',
            }}
        />
    );
}

// ─── Overlay iframe ───────────────────────────────────────────────────────────

function OverlayFrame({ doc }) {
    const iframeRef = useRef(null);
    const [active, setActive] = useState(false);

    useEffect(() => {
        function onMessage(e) {
            if (!iframeRef.current || e.source !== iframeRef.current.contentWindow) return;
            if (e.data?.type === 'pf-active') {
                setActive(!!e.data.active);
            }
        }
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);

    return (
        <iframe
            ref={iframeRef}
            srcDoc={doc}
            title="PromptForm"
            allowTransparency="true"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                border: 'none',
                background: 'transparent',
                zIndex: 2147483647,
                pointerEvents: active ? 'auto' : 'none',
            }}
        />
    );
}

// ─── Root widget ──────────────────────────────────────────────────────────────

export default function FormWidget({ ulid, apiUrl }) {
    const [form, setForm]     = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState(null);

    useEffect(() => {
        fetch(`${apiUrl}/forms/${ulid}`, {
            headers: {
                'Accept': 'application/json',
                'ngrok-skip-browser-warning': 'true',
            },
        })
            .then((res) => {
                if (res.status === 404) throw new Error('not_found');
                if (res.status === 403) throw new Error('draft');
                if (!res.ok) throw new Error('server_error');
                return res.json();
            })
            .then((json) => setForm(json.data))
            .catch((err) => {
                if (err.message === 'draft') {
                    setError('This form is in draft mode. Publish it from your PromptForm dashboard to display it here.');
                } else if (err.message === 'not_found') {
                    setError('Form not found. Check that the Form ID is correct.');
                } else {
                    setError('Unable to load form. Check your connection and try again.');
                }
            })
            .finally(() => setLoading(false));
    }, [ulid, apiUrl]);

    if (loading) return null;

    if (error) {
        return (
            <div style={{ padding: '12px 16px', background: '#fef2f2', borderRadius: 8, color: '#991b1b', fontSize: 13, fontFamily: 'sans-serif' }}>
                {error}
            </div>
        );
    }

    if (!form?.component) return null;

    const doc       = form.is_compiled
        ? buildCompiledDoc(form.component)
        : buildJsxDoc(form.component);
    const isOverlay = OVERLAY_TYPES.includes(form.layout_type);

    return isOverlay
        ? <OverlayFrame doc={doc} />
        : <InlineFrame doc={doc} />;
}
