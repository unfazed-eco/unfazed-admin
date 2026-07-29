import { DingdingOutlined } from '@ant-design/icons';
import { GridContent } from '@ant-design/pro-components';
import { Button, Card, Descriptions, Result, Steps } from 'antd';
import React, { Fragment } from 'react';
import useStyles from './index.style';

const { Step } = Steps;

export default () => {
  const { styles } = useStyles();
  const desc1 = (
    <div className={styles.title}>
      <div
        style={{
          margin: '8px 0 4px',
        }}
      >
        <span>Qu Lili</span>
        <DingdingOutlined
          style={{
            marginLeft: 8,
            color: '#00A0E9',
          }}
        />
      </div>
      <div>2016-12-12 12:32</div>
    </div>
  );
  const desc2 = (
    <div
      style={{
        fontSize: 12,
      }}
      className={styles.title}
    >
      <div
        style={{
          margin: '8px 0 4px',
        }}
      >
        <span>Zhou Maomao</span>
        <a href="">
          <DingdingOutlined
            style={{
              color: '#00A0E9',
              marginLeft: 8,
            }}
          />
          <span>Send reminder</span>
        </a>
      </div>
    </div>
  );
  const content = (
    <>
      <Descriptions title="Project Name">
        <Descriptions.Item label="Project ID">23421</Descriptions.Item>
        <Descriptions.Item label="Owner">Qu Lili</Descriptions.Item>
        <Descriptions.Item label="Effective period">
          2016-12-12 ~ 2017-12-12
        </Descriptions.Item>
      </Descriptions>
      <br />
      <Steps progressDot current={1}>
        <Step
          title={
            <span
              style={{
                fontSize: 14,
              }}
            >
              Create project
            </span>
          }
          description={desc1}
        />
        <Step
          title={
            <span
              style={{
                fontSize: 14,
              }}
            >
              Department review
            </span>
          }
          description={desc2}
        />
        <Step
          title={
            <span
              style={{
                fontSize: 14,
              }}
            >
              Finance review
            </span>
          }
        />
        <Step
          title={
            <span
              style={{
                fontSize: 14,
              }}
            >
              Completed
            </span>
          }
        />
      </Steps>
    </>
  );
  const extra = (
    <Fragment>
      <Button type="primary">Back to list</Button>
      <Button>View project</Button>
      <Button>Print</Button>
    </Fragment>
  );
  return (
    <GridContent>
      <Card bordered={false}>
        <Result
          status="success"
          title="Submission successful"
          subTitle="This result page is used to present the outcome of a series of tasks. For simple actions, a global message is usually enough. This area can contain additional notes, while the gray section below can present more detailed content such as records or documents."
          extra={extra}
          style={{
            marginBottom: 16,
          }}
        >
          {content}
        </Result>
      </Card>
    </GridContent>
  );
};
