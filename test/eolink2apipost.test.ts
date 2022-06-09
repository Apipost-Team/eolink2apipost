import Eolink2Apipost from '../src/eolink2apipost'
let path = require('path')
let fs = require('fs')

describe('works', () => {
  let eolinkJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/eolink.json'), 'utf-8'));
  let eolink2Apipost=new Eolink2Apipost();
  let result=eolink2Apipost.convert(eolinkJson);
  it('Eolink2Apipost test', () => {
    expect(result.status).toBe('success');
  });
});

