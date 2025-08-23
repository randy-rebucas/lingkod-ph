import {getRequestConfig} from 'next-intl/server';
 
// Can be imported from a shared config
const locales = ['en', 'tl'];
 
export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
      return {
          messages: (await import(`./messages/en.json`)).default,
      }
  };
 
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});