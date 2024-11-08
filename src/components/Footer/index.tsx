import { DefaultFooter } from '@ant-design/pro-components';
import React from 'react';

const Title: React.FC = () => <p>UNFAZED ADMIN</p>;

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center',
      }}
      links={[
        {
          key: 'Unfazed-Admin',
          title: <Title />,
          href: 'https://github.com/unfazed-eco/unfazed-admin',
          blankTarget: true,
        },
      ]}
      copyright={false}
    />
  );
};

export default Footer;
