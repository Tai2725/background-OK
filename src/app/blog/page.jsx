import { CONFIG } from 'src/global-config';
import { getLatestPosts } from 'src/actions/blog-ssr';

import { BlogHomeView } from 'src/sections/blog/view';

// ----------------------------------------------------------------------

export const metadata = {
  title: `Blog - ${CONFIG.appName}`,
  description:
    'Tips, tricks và hướng dẫn sử dụng phần mềm. Cập nhật thường xuyên với những bài viết hữu ích.',
};

export default async function Page() {
  const { latestPosts } = await getLatestPosts();

  return <BlogHomeView posts={latestPosts} />;
}
