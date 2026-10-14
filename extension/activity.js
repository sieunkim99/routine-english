/** Small, explicit site context when a page has no readable text. No browsing or model call. */
export function activityContext(tab){
 let host;try{const url=new URL(tab?.url);if(!['https:','http:'].includes(url.protocol))return null;host=url.hostname.toLowerCase().replace(/^www\./,'');}catch{return null;}
 const known=[[/^(?:.*\.)?instagram\.com$/,'Instagram'],[/^(?:.*\.)?youtube\.com$/,'YouTube'],[/^(?:.*\.)?tiktok\.com$/,'TikTok'],[/^(?:.*\.)?reddit\.com$/,'Reddit'],[/^(?:.*\.)?github\.com$/,'GitHub'],[/^(?:.*\.)?notion\.(?:so|site|com)$/,'Notion'],[/^(?:.*\.)?naver\.com$/,'Naver']];
 const site=known.find(([pattern])=>pattern.test(host))?.[1]||host;
 return {title:`${site} · 지금 하는 일`,url:new URL(tab.url).origin,site,kind:'activity',text:`The learner is currently on ${site}. Page text, images, posts, and their specific action are not known.`,capturedAt:Date.now()};
}
