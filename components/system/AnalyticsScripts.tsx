import Script from 'next/script'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-1D0V1F9YP'
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? 'vvs8j7xjaq'

export function AnalyticsScripts() {
  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  const gaInlineCode = [
    "window.dataLayer = window.dataLayer || [];",
    "function gtag(){dataLayer.push(arguments);}",
    "window.gtag = window.gtag || gtag;",
    "gtag('js', new Date());",
    "gtag('config', '" + GA_MEASUREMENT_ID + "', { anonymize_ip: true });",
  ].join('')

  const clarityInlineCode =
    "(function(c,l,a,r,i,t,y){" +
    "c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};" +
    "t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;" +
    "y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);" +
    "})(window, document, 'clarity', 'script', '" + CLARITY_PROJECT_ID + "');"

  return (
    <>
      {GA_MEASUREMENT_ID ? (
        <>
          <Script
            src={'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID}
            strategy="beforeInteractive"
          />
          <Script id="ga4-script" strategy="beforeInteractive">
            {gaInlineCode}
          </Script>
        </>
      ) : null}

      {CLARITY_PROJECT_ID ? (
        <Script id="clarity-script" strategy="beforeInteractive">
          {clarityInlineCode}
        </Script>
      ) : null}
    </>
  )
}
