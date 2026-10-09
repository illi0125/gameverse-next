import React from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { NoticeManager } from '../../../libs/components/admin/cs/NoticeManager';
import { noticeKinds } from '../../../libs/components/admin/cs/supportMeta';

const AdminNotice: NextPage = () => <NoticeManager kind={noticeKinds.NOTICE} />;

export default withAdminLayout(AdminNotice);
