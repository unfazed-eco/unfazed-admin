import { Link } from '@umijs/max';
import { Button, Card, Result } from 'antd';
import React from 'react';

export default () => (
  <Card variant="borderless">
    <Result
      status="500"
      title="500"
      subTitle="Sorry, something went wrong."
      extra={
        <Link to="/">
          <Button type="primary">Back Home</Button>
        </Link>
      }
    />
  </Card>
);
