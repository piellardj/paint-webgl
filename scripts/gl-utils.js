"use strict";

/**
 * Utilitary methods for shader creation.
 */
const Shader = (function() {
  /* Private methods */
  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
  
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
  }

  /**
   * Extends a WebGLProgram with information about its uniforms and attributes.
   * Uniforms information is stored in program.u[<uniform name>] and includes
   * location, size and type.
   * Attributes information is stored in program.a[<attrib name>].
   * @param {WebGLRenderingContext} gl
   * @param {WebGLProgram} program
   */
  function programIntrospection(gl, program) {
    program.uCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    program.u = {};
    for (let i = 0; i < program.uCount; ++i) {
        const uniform = gl.getActiveUniform(program, i);
        const name = uniform.name;

        program.u[name] = {
          loc: gl.getUniformLocation(program, name),
          size: uniform.size,
          type: uniform.type
        };
    }
    
    program.aCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    program.a = {};
    for (let i = 0; i < program.aCount; ++i) {
        const attribute = gl.getActiveAttrib(program, i);
        const name = attribute.name.replace(/\[0\]/, ""); //for array uniforms

        program.a[name] = {
          loc: gl.getAttribLocation(program, name),
          size: attribute.size,
          type: attribute.type
        };
    }
  }

  /**
   * 
   * @param {WebGLRenderingContext} gl
   * @param {WebGLShader} vertexShader
   * @param {WebGLShader} fragmentShader
   */
  function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      programIntrospection(gl, program);
      
      return program;
    }
   
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
  }
  
  function notImplemented() { alert("NOT IMPLEMENTED YET") }
  
  function bindUniformFloat(gl, location, value, isArray) {
    if (isArray) {
      gl.uniform1fv(location, value);
    } else {
      gl.uniform1f(location, value);
    }
  }
  
  function bindUniformFloat2v(gl, location, value, isArray) {
    gl.uniform2fv(location, value);
  }
  
  function bindUniformFloat3v(gl, location, value, isArray) {
    gl.uniform3fv(location, value);
  }
  
  function bindUniformFloat4v(gl, location, value, isArray) {
    gl.uniform4fv(location, value);
  }
  
  function bindUniformInt2v(gl, location, value, isArray) {
    gl.uniform2iv(location, value);
  }
  
  function bindUniformInt3v(gl, location, value, isArray) {
    gl.uniform3iv(location, value);
  }
  
  function bindUniformInt4v(gl, location, value, isArray) {
    gl.uniform4iv(location, value);
  }
  
  function bindUniformBool(gl, location, value, isArray) {
    gl.uniform1i(location, value);
  }
  
  function bindUniformBool2v(gl, location, value, isArray) {
    gl.uniform2iv(location, value);
  }
  
  function bindUniformBool3v(gl, location, value, isArray) {
    gl.uniform3iv(location, value);
  }
  
  function bindUniformBool4v(gl, location, value, isArray) {
    gl.uniform4iv(location, value);
  }
  
  function bindUniformFloatMat2(gl, location, value, isArray) {
    gl.uniformMatrix2fv(location, false, v);
  }
  
  function bindUniformFloatMat3(gl, location, value, isArray) {
    gl.uniformMatrix3fv(location, false, v);
  }
  
  function bindUniformFloatMat4(gl, location, value, isArray) {
    gl.uniformMatrix4fv(location, false, v);
  }

  function bindSampler2D(gl, location, unitNb, unit, value) {
    gl.uniform1i(location, unitNb);
    gl.activeTexture(unit);
    gl.bindTexture(gl.TEXTURE_2D, value);
  }
  
  function bindSamplerCube(gl, location, unitNb, unit, value) {
    gl.uniform1i(location, unitNb);
    gl.activeTexture(unit);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, value);
  }
  
  function bindUniformInt(gl, location, value, isArray) {
    if (isArray) {
      gl.uniform1iv(location, value);
    } else {
      gl.uniform1i(location, value);
    }
  }
  
    /* From WebGL spec:
   * http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14 */
  const types = {
    0x8B50: {str: 'FLOAT_VEC2',     binder: bindUniformFloat2v},
    0x8B51: {str: 'FLOAT_VEC3',     binder: bindUniformFloat3v},
    0x8B52: {str: 'FLOAT_VEC4',     binder: bindUniformFloat4v},
    0x8B53: {str: 'INT_VEC2',       binder: bindUniformInt2v},
    0x8B54: {str: 'INT_VEC3',       binder: bindUniformInt3v},
    0x8B55: {str: 'INT_VEC4',       binder: bindUniformInt4v},
    0x8B56: {str: 'BOOL',           binder: bindUniformBool},
    0x8B57: {str: 'BOOL_VEC2',      binder: bindUniformBool2v},
    0x8B58: {str: 'BOOL_VEC3',      binder: bindUniformBool3v},
    0x8B59: {str: 'BOOL_VEC4',      binder: bindUniformBool4v},
    0x8B5A: {str: 'FLOAT_MAT2',     binder: bindUniformFloatMat2},
    0x8B5B: {str: 'FLOAT_MAT3',     binder: bindUniformFloatMat3},
    0x8B5C: {str: 'FLOAT_MAT4',     binder: bindUniformFloatMat4},
    0x8B5E: {str: 'SAMPLER_2D',     binder: bindSampler2D},
    0x8B60: {str: 'SAMPLER_CUBE',   binder: bindSamplerCube},
    0x1400: {str: 'BYTE',           binder:   notImplemented},
    0x1401: {str: 'UNSIGNED_BYTE',  binder:  notImplemented},
    0x1402: {str: 'SHORT',          binder:  notImplemented},
    0x1403: {str: 'UNSIGNED_SHORT', binder:  notImplemented},
    0x1404: {str: 'INT',            binder: bindUniformInt},
    0x1405: {str: 'UNSIGNED_INT',   binder:  notImplemented},
    0x1406: {str: 'FLOAT',          binder: bindUniformFloat}
  };

  /**
   * Binds every provided uniform of the shader program.
   * To provide a uniform, the object program.u["uniformName"].value
   * should exist and have a type matching program.u["uniformName"].type.
   * @param {WebGLRenderingContext} gl
   */
  function bindUniforms(gl) {
    const textureUnits = [
      gl.TEXTURE0,
      gl.TEXTURE1,
      gl.TEXTURE2,
      gl.TEXTURE3,
      gl.TEXTURE4,
      gl.TEXTURE5,
      gl.TEXTURE6,
      gl.TEXTURE7,
      gl.TEXTURE8,
      gl.TEXTURE9];
    let currTextureUnitNb = 0;
    
    for (let uName in this.u) {
      const uniform = this.u[uName];
      const valueExists = (typeof uniform.value != typeof undefined);
      if (valueExists) {
        const isArray = (uniform.size > 1 && uName.substr(-3) === "[0]");
        
        if (uniform.type === 0x8B5E || uniform.type === 0x8B60) {
          const unitNb = currTextureUnitNb;
          const unit = textureUnits[unitNb];
          types[uniform.type].binder(gl, uniform.loc, unitNb, unit, uniform.value);
          currTextureUnitNb++;
        } else {              
          types[uniform.type].binder(gl, uniform.loc, uniform.value, isArray);
        }
      }
    }
  }

  /**
   * Binds every provided attribute of the shader program.
   * To provide an attribute, the object program.a["attribName"].VBO
   * should have at least the following attributes:
   * data: id of the VBO to bind
   * size: size of the elements of the VBO
   * type: type of the elements of the VBO
   * @param {WebGLRenderingContext} gl
   */
  function bindAttributes(gl) {
    for (let aName in this.a) {
      const attribute = this.a[aName];
      const VBOExists = (typeof attribute.VBO != typeof undefined);
      if (VBOExists) {
        const size = attribute.VBO.size;
        const type = attribute.VBO.type;
        const normalize = attribute.VBO.normalize || false;
        const stride = attribute.VBO.stride || 0;
        const offset = attribute.VBO.offset || 0;
        
        gl.enableVertexAttribArray(attribute.loc);
        gl.bindBuffer(gl.ARRAY_BUFFER, attribute.VBO.data);
        gl.vertexAttribPointer(attribute.loc, size, type, normalize, stride, offset);
      }
    }
  }
  
  /* Public methods */
  const visible = {
    /**
     * Creates a shader program from source, extended with information about
     * its uniforms and attributes.
     * Information about a uniform is stored in program.u["name"].
     * Information about an attribute is stored in program.a["name"].
     * @param {WebGLRenderingContext} gl
     * @param {string} vertexSrc
     * @param {string} fragmentSrc
     * @returns {object} Enhanced WebGLProgram object.
    */
    fromString: function(gl, vertexSrc, fragmentSrc) {
      const vertShader = createShader(gl, gl.VERTEX_SHADER, vertexSrc);
      const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);
      
      const shader = createProgram(gl, vertShader, fragShader);
      shader.bindUniforms = bindUniforms;
      shader.bindAttributes = bindAttributes;
      shader.bindUniformsAndAttributes = (gl) => {
        shader.bindUniforms(gl);
        shader.bindAttributes(gl);
      };
      
      return Object.freeze(shader);
    },

    /**
     * Creates a shader program, extended with information about
     * its uniforms and attributes.
     * @param {WebGLRenderingContext} gl
     * @param {string} vertexSrc
     * @param {string} fragmentSrc
    * @returns {object} Enhanced WebGLProgram object.
    */
    fromScript: function(gl, vertexScriptId, fragmentScriptId) {
      const vertexSrc = document.getElementById(vertexScriptId).text;
      const fragmentSrc = document.getElementById(fragmentScriptId).text;
      
      return this.fromString(gl, vertexSrc, fragmentSrc);
    },
    
    typeToString: function(type) {
      return type[type].str;
    }
  };
  
  return Object.freeze(visible);
})();


/**
 * Collection of static utilitary methods related to FBOs.
 */
const FBO = (function() {
  const visible = {
    create: function(gl, width, height) {
      const FBO = gl.createFramebuffer();
      FBO.width = width;
      FBO.height = height;
      
      FBO.bind = function(gl, color, depth=null) { 
        gl.bindFramebuffer(gl.FRAMEBUFFER, this);
        gl.viewport(0, 0, this.width, this.height);
      
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);
        
        if (depth !== null) {
          gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
          gl.framebufferRenderbuffer(
            gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
        }
      };
      
      return FBO;
    },
    
    bindDefault: function(gl) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);//gl.drawingBufferWidth, gl.drawingBufferHeight);
    }
  };
  
  return Object.freeze(visible);
})();


/**
 * Collection of static utilitary methods related to VBOs.
 */
const VBO = (function() {
  const visible = {
    createFromArray: function(gl, array, size, type) {
      const VBO = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
      gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      
      return {data: VBO, size: size, type: type};
    },
    
    createQuad: function(gl, minX, minY, maxX, maxY) {
      let vert = [
        minX, minY,
        maxX, minY,
        minX, maxY,
        maxX, maxY];
      
      return this.createFromArray(gl, new Float32Array(vert), 2, gl.FLOAT);
      }
  };
  
  return Object.freeze(visible);
})();

const Utils = (function() {
  const visible = {
    resizeCanvas: function(gl, hidpi=false) {
      const cssPixel = (hidpi) ? window.devicePixelRatio : 1;

      const width = Math.floor(gl.canvas.clientWidth * cssPixel);
      const height = Math.floor(gl.canvas.clientHeight * cssPixel);
      if (gl.canvas.width != width || gl.canvas.height != height) {
         gl.canvas.width = width;
         gl.canvas.height = height;
      }
    }
  };
  
  return Object.freeze(visible);
})();