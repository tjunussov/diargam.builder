<xsl:stylesheet version="1.0" 
		 xmlns="http://www.w3.org/1999/xhtml"
		 xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
		xmlns:exslt="http://exslt.org/common"
		exclude-result-prefixes="exslt msxsl">
  




<xsl:variable name="x">
  <y title="Hello"/>
</xsl:variable>

<xsl:template match="x">
  <html>
    <head><title>test exslt node set</title></head>
    <body>
      <xsl:value-of select="exslt:node-set($x)/y/@title"/>
    </body>
  </html>
</xsl:template>


</xsl:stylesheet>