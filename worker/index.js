export default {
  async fetch(request) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const url = new URL(request.url);
    const target = url.searchParams.get('url');

    // 보안: kolonmall.com Product 페이지만 허용
    if (!target || !/^https:\/\/(www\.)?kolonmall\.com\/Product\//.test(target)) {
      return new Response(JSON.stringify({ error: 'kolonmall.com/Product/ URL만 허용됩니다' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    try {
      const res = await fetch(target, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      });
      const html = await res.text();

      // Prod_Img URL 전체 추출
      const pattern = /https:\/\/images\.kolonmall\.com\/Prod_Img\/[^"\\]+/g;
      const matches = [...new Set(html.match(pattern) || [])];

      // slick-slider 내 img src에서 LM 메인이미지 별도 추출 (순서 보존)
      const mainPattern = /<img[^>]+src="(https:\/\/images\.kolonmall\.com\/Prod_Img\/[^"]*\/LM\d+\/[^"]+)"/g;
      const mainUrls = [];
      let m;
      while ((m = mainPattern.exec(html)) !== null) {
        if (!mainUrls.includes(m[1])) mainUrls.push(m[1]);
      }

      return new Response(JSON.stringify({ urls: matches, mainUrls }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  },
};
