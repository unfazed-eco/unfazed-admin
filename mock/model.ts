import { Request, Response } from 'express';

const modelDesc = (requset: Request, response: Response) => {
  return {
    code: 0,
    message: 'success',
    data: {
      name: 'hello unfazed',
    },
  };
};

export default {
  modelDesc,
};
