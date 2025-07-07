// components/Analytics.jsx
"use client";

import Script from "next/script";
import { useEffect } from "react";

export default function Analytics() {
    // Efeito para tracking events após os scripts estarem carregados
    useEffect(() => {
        // Verifica se os scripts já carregaram
        const trackEvents = () => {
            if (typeof window.fbq === 'function') {
                window.fbq('track', 'InitiateCheckout');
                window.fbq('track', 'Lead');
                window.fbq('track', 'Purchase');
            }

            if (typeof window.gtag === 'function') {
                window.gtag('event', 'conversion', {
                    'send_to': 'AW-17010595542/8yPWCPKzsLkaENatpK8_'
                });
                // outros eventos...
            }
        };

        // Tenta executar após um pequeno delay
        const timer = setTimeout(() => {
            trackEvents();
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            {/* Scripts base */}
            <Script id="fb-base" strategy="afterInteractive">
                {`
          !function(f,b,e,v,n,t,s){
            if(f.fbq) return;
            n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq) f._fbq=n;
            n.push=n; n.loaded=!0; n.version='2.0'; n.queue=[];
            t=b.createElement(e); t.async=!0;
            t.src=v; s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)
          }(window, document,'script',
             'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '1033180232110037');
          fbq('track', 'PageView');
        `}
            </Script>

            <Script
                src="https://www.googletagmanager.com/gtag/js?id=AW-17010595542"
                strategy="afterInteractive"
            />
            <Script id="gtag-base" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-17010595542');
        `}
            </Script>
        </>
    );
}